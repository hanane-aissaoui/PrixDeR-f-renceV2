<?php
header('Content-Type: application/json');
require 'db.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Données JSON invalides.']);
    exit;
}

if (isset($data['numero'], $data['objectif'], $data['estimation'], $data['type_prestation'])) {
    $numero = $data['numero'];
    $objectif = $data['objectif'];
    $estimation = $data['estimation'];
    $type_prestation = $data['type_prestation'];

    try {
        // Vérifier si le projet existe déjà
        $stmt = $pdo->prepare("SELECT id FROM projets WHERE numero = ?");
        $stmt->execute([$numero]);
        $projet = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($projet) {
            // Mise à jour du projet existant
            $projet_id = $projet['id'];
            $stmt = $pdo->prepare("UPDATE projets SET objectif = ?, estimation = ?, type_prestation = ? WHERE id = ?");
            $stmt->execute([$objectif, $estimation, $type_prestation, $projet_id]);

            // Supprimer les anciennes offres
            $stmt = $pdo->prepare("DELETE FROM offres WHERE projet_id = ?");
            $stmt->execute([$projet_id]);
        } else {
            // Insertion d'un nouveau projet
            $stmt = $pdo->prepare("INSERT INTO projets (numero, objectif, estimation, type_prestation) VALUES (?, ?, ?, ?)");
            $stmt->execute([$numero, $objectif, $estimation, $type_prestation]);
            $projet_id = $pdo->lastInsertId();
        }

        // Insertion des offres associées
        if (isset($data['offres']) && is_array($data['offres'])) {
            $stmtOffre = $pdo->prepare("INSERT INTO offres (projet_id, nom_concurrent, offre) VALUES (?, ?, ?)");
            foreach ($data['offres'] as $offre) {
                $stmtOffre->execute([$projet_id, $offre['nom_concurrent'], $offre['offre']]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Projet et offres enregistrés avec succès.', 'projet_id' => $projet_id]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur : ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Paramètres insuffisants.']);
?>
