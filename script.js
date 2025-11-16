document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const addCompetitorBtn = document.getElementById('add-competitor-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const competitorForm = document.getElementById('competitor-form');
    const competitorsList = document.getElementById('competitors-list');
    const calculateBtn = document.getElementById('calculate-btn');
    const saveBtn = document.getElementById('save-btn');
    const initializeBtn = document.getElementById('initialize-btn');
    const printBtn = document.getElementById('print-btn'); // Nouveau bouton
    const referencePriceElem = document.getElementById('reference-price');
    const estimationInput = document.getElementById('estimation');
    const travauxRadio = document.getElementById('travaux');
    const servicesRadio = document.getElementById('services');
    const resultsSection = document.getElementById('results');

   const toggleSearchBtn = document.getElementById('toggle-search');
const searchContainer = document.getElementById('search-container');
const searchNumeroInput = document.getElementById('search-numero');
const searchBtn = document.getElementById('search-btn');
const sidebar=document.getElementById('sidebar');

toggleSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Empêche le window listener de se déclencher
    searchContainer.classList.add('active');
    toggleSearchBtn.style.display = 'none';
    searchNumeroInput.focus();
    sidebar.style.display = 'none';
    menu.style.display = 'none';
});

// Quand on clique sur "Rechercher"
searchBtn.addEventListener('click', () => {
     menu.style.display = 'block';
    lancerRecherche();
});

// Aussi recherche au Enter dans input
searchNumeroInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        lancerRecherche();
    }
});

function lancerRecherche() {
    const numeroRecherche = searchNumeroInput.value.trim();
    if (!numeroRecherche) {
        alert("Veuillez saisir un N° de projet à rechercher.");
        return;
    }

    fetch('load_project.php?numero=' + encodeURIComponent(numeroRecherche))
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remplir champs etc...
                document.getElementById('nt').value = data.projet.numero;
                document.getElementById('obj').value = data.projet.objectif;
                document.getElementById('estimation').value = data.projet.estimation;

                if (data.projet.type_prestation === 'T') {
                    document.getElementById('travaux').checked = true;
                } else if (data.projet.type_prestation === 'S') {
                    document.getElementById('services').checked = true;
                }

                competitors = data.offres.map(offre => ({
                    name: offre.nom_concurrent,
                    bid: parseFloat(offre.offre)
                }));

                updateCompetitorsList();

                // Après chargement, fermer la barre
                searchContainer.classList.remove('active');
                toggleSearchBtn.style.display = 'flex';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement du projet :", error);
            alert("Erreur serveur lors de la recherche.");
        });
}


    let competitors = [];

    addCompetitorBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });


  window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (!sidebar.contains(event.target) && !menu.contains(event.target)) {
    sidebar.style.display = 'none';
}

         if (
        searchContainer.classList.contains('active') &&
        !searchContainer.contains(event.target) &&
        event.target !== toggleSearchBtn
    ) {
        searchContainer.classList.remove('active');
        toggleSearchBtn.style.display = 'flex';
        sidebar.style.display='none';
    }
     if (!searchContainer.contains(event.target)) {
        menu.style.display = 'block';}
    });
    competitorForm.addEventListener('submit', (event) => {
        

        const name = document.getElementById('competitor-name').value;
        const bid = parseFloat(document.getElementById('competitor-bid').value);

        if (name && !isNaN(bid)) {
            competitors.push({ name, bid });
            updateCompetitorsList();

            document.getElementById('competitor-name').value = '';
            document.getElementById('competitor-bid').value = '';
        }

        modal.style.display = 'none';
        event.preventDefault();
    });

   calculateBtn.addEventListener('click', () => {
    const numero = document.getElementById('nt').value.trim();
    const objectif = document.getElementById('obj').value.trim();
    const estimation = parseFloat(estimationInput.value);
    const type = travauxRadio.checked ? 'T' : servicesRadio.checked ? 'S' : null;

    if (!numero || !objectif || isNaN(estimation) || !type) {
        alert('Veuillez remplir tous les champs requis et sélectionner un type de prestation.');
        return;
    }

    if (competitors.length === 0) {
        alert('Veuillez ajouter des concurrents.');
        return;
    }

    const referencePrice = calculateReferencePrice(estimation, type);
    referencePriceElem.textContent = referencePrice.toFixed(2);
    updateTables(referencePrice, estimation, type);
    resultsSection.style.display = 'block';
});


   saveBtn.addEventListener('click', () => {
    const numero = document.getElementById('nt').value.trim();
    const objectif = document.getElementById('obj').value.trim();
    const estimation = parseFloat(estimationInput.value);
    const type = travauxRadio.checked ? 'T' : servicesRadio.checked ? 'S' : null;

    if (!numero || !objectif || isNaN(estimation) || !type) {
        alert('Veuillez remplir tous les champs requis avant d\'enregistrer.');
        return;
    }

    if (competitors.length === 0) {
        alert('Veuillez ajouter des concurrents avant d\'enregistrer.');
        return;
    }

    const payload = {
        numero,
        objectif,
        estimation,
        type_prestation: type,
        offres: competitors.map(c => ({
            nom_concurrent: c.name,
            offre: c.bid
        }))
    };

    fetch('save.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Projet et offres enregistrés avec succès.');
        } else {
            alert('Erreur serveur : ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erreur JS :', error);
        alert('Erreur lors de la communication avec le serveur.');
    });
});




    function calculateReferencePrice(estimation, type) {
        const filteredCompetitors = competitors.filter(comp => 
            (type === 'T' ? comp.bid >= estimation * 0.8 && comp.bid <= estimation * 1.2 : comp.bid >= estimation * 0.75 && comp.bid <= estimation * 1.2)
        );
        const sum = filteredCompetitors.reduce((acc, comp) => acc + comp.bid, 0);
        const avg = sum / filteredCompetitors.length;
        return (estimation + avg) / 2;
    }
    // function calculateEcart(offer, estimation) {
    //     const ecart = ((offer - estimation) / estimation * 100).toFixed(2);
    //     return `${ecart}%`; // Ajouter le symbole "%"
    // }
    function calculateEcart(offer, estimation) {
        const ecart = ((offer - estimation) / estimation * 100).toFixed(2);
        const sign = ecart >= 0 ? '+' : ''; // Ajouter le signe "+" pour les valeurs positives
        return `${sign}${ecart}%`; // Afficher l'écart avec le symbole "%"
    }
    function updateTables(referencePrice, estimation, type) {
        const excesList = document.getElementById('exces-list');
        const anormBasseList = document.getElementById('anorm-basse-list');
        const classementList = document.getElementById('classement-list');
    
        // Offres Excès
        const excesCompetitors = competitors.filter(comp => comp.bid > referencePrice &&
            (type === 'T' ? comp.bid > estimation * 1.2 : comp.bid > estimation * 1.2)
        );
        excesList.innerHTML = excesCompetitors.length ? excesCompetitors.map(comp => 
            `<tr><td>${comp.name}</td><td>${comp.bid.toFixed(2)} (${calculateEcart(comp.bid, estimation)})</td></tr>`
        ).join('') : '<tr><td colspan="2">Néant</td></tr>';
    
        // Offres Anorm Basse
        const anormBasseCompetitors = competitors.filter(comp => comp.bid < referencePrice &&
            (type === 'T' ? comp.bid < estimation * 0.8 : comp.bid < estimation * 0.75)
        );
        anormBasseList.innerHTML = anormBasseCompetitors.length ? anormBasseCompetitors.map(comp => 
            `<tr><td>${comp.name}</td><td>${comp.bid.toFixed(2)} (${calculateEcart(comp.bid, estimation)})</td></tr>`
        ).join('') : '<tr><td colspan="2">Néant</td></tr>';
    
        // Récupérer les noms des concurrents des offres excès et anormalement basses
        const excludedCompetitors = new Set([
            ...excesCompetitors.map(comp => comp.name),
            ...anormBasseCompetitors.map(comp => comp.name)
        ]);
    
        // Classement Offres
        const classementCompetitors = competitors
            .filter(comp => !excludedCompetitors.has(comp.name)) // Exclure les concurrents déjà listés
            .map(comp => ({
                ...comp,
                ecart: calculateEcart(comp.bid, estimation)
            }));
    
        // Séparer les concurrents en deux groupes
        const belowReference = classementCompetitors.filter(comp => comp.bid < referencePrice);
        const aboveReference = classementCompetitors.filter(comp => comp.bid >= referencePrice);
    
        // Trier les groupes
        belowReference.sort((a, b) => b.bid - a.bid); // Décroissant pour les offres inférieures
        aboveReference.sort((a, b) => a.bid - b.bid); // Croissant pour les offres supérieures
    
        // Fusionner les deux groupes
        const sortedCompetitors = [...belowReference, ...aboveReference];
    
        classementList.innerHTML = sortedCompetitors.length ? sortedCompetitors.map((comp, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${comp.name}</td>
                <td>${comp.bid.toFixed(2)}</td>
                <td>${comp.ecart}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">Néant</td></tr>';
    
        // Trouver l'offre la plus proche du prix de référence
        let closestBelow = null;
        let closestAbove = null;
    
        if (belowReference.length > 0) {
            closestBelow = belowReference.reduce((prev, curr) => Math.abs(curr.bid - referencePrice) < Math.abs(prev.bid - referencePrice) ? curr : prev);
        }
        if (aboveReference.length > 0) {
            closestAbove = aboveReference.reduce((prev, curr) => Math.abs(curr.bid - referencePrice) < Math.abs(prev.bid - referencePrice) ? curr : prev);
        }
    
        // Afficher le message approprié
        const messageElem = document.getElementById('closest-offer-message');
        if (closestBelow) {
             messageElem.innerHTML =`<h3 style="text-align: center">L'offre la plus proche du prix de référence par défaut est ${closestBelow.bid.toFixed(2)} DH.</h3>`;
        } else if (closestAbove) {
            messageElem.innerHTML = `<h3 style="text-align: center">L'offre la plus proche du prix de référence par excès est ${closestAbove.bid.toFixed(2)} DH.</h3>`;
        } else {
            messageElem.innerHTML = '<h3 style="text-align: center">Aucune offre ne correspond aux critères.</h3>';
        }
    }
    
    
    function updateCompetitorsList() {
        competitorsList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nom de Concurrent</th>
                        <th>Montant de l'offre financière</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${competitors.map((competitor, index) => `
                        <tr>
                            <td>${competitor.name}</td>
                            <td>${competitor.bid.toFixed(2)}</td>
                            <td><button class="delete-btn" style="background-color: #fff; border-color: #fff; box-shadow: none;" data-index="${index}">X</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Ajouter un écouteur d'événement pour les boutons de suppression
        competitorsList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                competitors.splice(index, 1);
                updateCompetitorsList();
            });
        });
    }

    // Vérifier si on vient de cliquer sur "Modifier"
const numeroProjet = localStorage.getItem('numeroProjet');
if (numeroProjet) {
    // On peut lancer un fetch pour récupérer les infos du projet
    fetch('load_project.php?numero=' + encodeURIComponent(numeroProjet))
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('nt').value = data.projet.numero;
                document.getElementById('obj').value = data.projet.objectif;
                document.getElementById('estimation').value = data.projet.estimation;

                if (data.projet.type_prestation === 'T') {
                    document.getElementById('travaux').checked = true;
                } else if (data.projet.type_prestation === 'S' || data.projet.type_prestation === 'A') {
                    document.getElementById('services').checked = true;
                }

                competitors = data.offres.map(offre => ({
                    name: offre.nom_concurrent,
                    bid: parseFloat(offre.offre)
                }));

                updateCompetitorsList();
            } else {
                alert(data.message);
            }

            // On supprime l'info pour éviter rechargements inutiles
            localStorage.removeItem('numeroProjet');
        })
        .catch(err => {
            console.error('Erreur JS :', err);
            alert('Erreur lors du chargement du projet.');
        });
}
 
    initializeBtn.addEventListener('click', () => {
        competitors = [];
        estimationInput.value = '';
        referencePriceElem.textContent = '-';
        document.getElementById('nt').value = '';
        document.getElementById('obj').value = '';
        searchNumeroInput.value = '';
        document.getElementById('exces-list').innerHTML = '<tr><td colspan="2">Néant</td></tr>';
        document.getElementById('anorm-basse-list').innerHTML = '<tr><td colspan="2">Néant</td></tr>';
        document.getElementById('classement-list').innerHTML = '<tr><td colspan="4">Néant</td></tr>';
        updateCompetitorsList();
        resultsSection.style.display = 'none';
    });
   

   
    printBtn.addEventListener('click', () => {
        const printWindow = window.open('', '', 'height=600,width=800');
           const numero = document.getElementById('nt').value.trim();
    const objectif = document.getElementById('obj').value.trim();
        let natureDePrestation = travauxRadio.checked ? 'Travaux' : servicesRadio.checked ? 'Autres' : '';
        let closestOfferMessage = document.getElementById('closest-offer-message') ? document.getElementById('closest-offer-message').textContent : 'Aucune offre disponible.';
    
        let content = `
            <html>
            <head>
                <title>Impression</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { width: 100%; margin: 0 auto; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background-color: #f4f4f4; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header .logo { margin-bottom: 20px;}
                    .header img { max-width: 70px; }
                    .header .logo-text { margin: 0; color: #145a8d;font-size: 1.2em; }
                    h1 { font-size: 1.5em; margin: 0;margin-top: 30px;color: #c64a11; }
                    .reference-price { text-align: left; margin-top: 20px; font-weight: bold;}
                    .page-break { page-break-before: always; }
                    @media print {
                        .results-table { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <img src="images/logo.png" alt="Logo" class="logo-img">
                        </div>
                        <p class="logo-text">L'Agence Régional d'Exécution des Projets Région de l'Oriental</p>
                        <h1>Evaluation des offres financières des concurrents</h1>
                        <p>N°:${numero} relatif à ${objectif} </p>
                    </div>
                    <div>
                        <h2 style="margin-right: 30px;margin-top: 35px;font-weight: normal; font-size: 1.2em;margin-top: 40px;">Nature de Prestation:<span style="font-size: 0.9em;font-weight: normal;">${natureDePrestation}</span></h2>
                    </div>
                    <div>
                        <h2 style="font-weight: normal; font-size: 1.2em;">Estimation:<span style="font-size: 0.9em;font-weight: normal;">${estimationInput.value} DH</span></h2>
                    </div>
                    <div class="competitors-list">
                        <h2 style="font-weight: normal; font-size: 1.2em;margin-top: 30px">Liste des Concurrents:</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom de Concurrent</th>
                                    <th>Montant de l'offre financière</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${competitors.map(comp => `
                                    <tr>
                                        <td>${comp.name}</td>
                                        <td>${comp.bid.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="results">
                        <h2 style="font-weight: normal; font-size: 1.2em;">Offres Excessive:</h2>
                        <table class="results-table" style="table-layout: fixed; word-break: break-word;">
                            <thead>
                                <tr>
                                    <th>Nom du Concurrent</th>
                                    <th>Montant de l'offre financière</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${document.getElementById('exces-list').innerHTML}
                            </tbody>
                        </table>
                        <h2 style="font-weight: normal; font-size: 1.2em;">Offres Anormalement Basse:</h2>
                        <table class="results-table" style="table-layout: fixed; word-break: break-word;">
                            <thead>
                                <tr>
                                    <th>Nom du Concurrent</th>
                                    <th>Montant de l'offre financière</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${document.getElementById('anorm-basse-list').innerHTML}
                            </tbody>
                        </table>
                        <div class="reference-price">
                            <span style="font-weight: normal; font-size: 1.2em;">Prix Référence:</span>
                            <span class="price">${referencePriceElem.textContent} DH</span>
                        </div>
                        <h2 style="font-weight: normal; font-size: 1.2em;">Classement des Offres:</h2>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Rang</th>
                                    <th>Nom du Concurrent</th>
                                    <th>Montant de l'offre financière</th>
                                    <th>Écart</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${document.getElementById('classement-list').innerHTML}
                            </tbody>
                        </table>
                        <h2 style="font-weight: normal; font-size: 1.2em;"></h2>
                        <p>${closestOfferMessage}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    
        printWindow.document.write(content);
        printWindow.document.close();
    
        printWindow.onload = () => {
            printWindow.print();
        };
    });
});    