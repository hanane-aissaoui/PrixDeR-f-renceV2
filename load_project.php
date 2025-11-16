<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_GET['numero'])) {
    echo json_encode(['success' => false, 'message' => 'Paramètre numéro manquant.']);
    exit;
}

$numero = $_GET['numero'];

// Récupérer les infos du projet
$stmt = $pdo->prepare("SELECT * FROM projets WHERE numero = ?");
$stmt->execute([$numero]);
$projet = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$projet) {
    echo json_encode(['success' => false, 'message' => 'Projet non trouvé.']);
    exit;
}

// Récupérer les offres liées
$stmt = $pdo->prepare("SELECT * FROM offres WHERE projet_id = ?");
$stmt->execute([$projet['id']]);
$offres = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'projet' => $projet,
    'offres' => $offres
]);
