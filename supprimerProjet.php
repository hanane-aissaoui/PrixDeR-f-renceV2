<?php
header('Content-Type: application/json');
require 'db.php'; // Fichier de connexion PDO à ta base

// Récupérer les données JSON envoyées
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['numero'])) {
    echo json_encode(['success' => false, 'message' => 'Numéro de projet manquant.']);
    exit;
}

$numero = $input['numero'];

try {
    // Préparer la requête pour supprimer le projet
    $stmt = $pdo->prepare("DELETE FROM projets WHERE numero = ?");
    $stmt->execute([$numero]);

    // Vérifier si un projet a été supprimé
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Projet supprimé avec succès.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Aucun projet trouvé avec ce numéro.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur base de données : ' . $e->getMessage()]);
}
