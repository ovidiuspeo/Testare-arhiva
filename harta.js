/* Versiunea 1.26 — Harta bazinului */
// -------------------------------------------------------------
// PASUL 2 — Inițializare hartă Leaflet
// -------------------------------------------------------------
let map = L.map('map').setView([45.5, 23.5], 9); // centru generic România

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// -------------------------------------------------------------
// 3. Încarcă peșterile dintr-un bazin
// -------------------------------------------------------------
async function incarcaPesteri(codB1) {
  document.getElementById("codB1Title").textContent = "CodB1: " + codB1;

  const { data, error } = await supa
    .from("pesteri_versiuni")
    .select("NrP1, Var, Denumire, Latit, Long")
    .eq("CodB1", codB1)
    .order("NrP1", { ascending: true })
    .order("Var", { ascending: true });

  if (error) {
    alert("Eroare la încărcare date.");
    console.error(error);
    return;
  }

  afiseazaInTabel(data);
}

function afiseazaInTabel(lista) {
  const tbody = document.querySelector("#tabelPesteri tbody");
  tbody.innerHTML = "";

  lista.forEach(r => {
    const tr = document.createElement("tr");

    // Nr = NrP1 + Var
    const tdNr = document.createElement("td");
    tdNr.textContent = r.NrP1 + (r.Var || "");

    // Denumire
    const tdDen = document.createElement("td");
    tdDen.textContent = r.Denumire;

    // Bulina roșu/verde (coloana 3)
    const tdCoord = document.createElement("td");
    const bulina = document.createElement("span");
    bulina.classList.add("bulina");

    if (r.Latit && r.Long) {
      bulina.classList.add("verde");
    } else {
      bulina.classList.add("rosu");
    }

    tdCoord.appendChild(bulina);

    // Adăugăm în ordinea corectă
    tr.appendChild(tdNr);
    tr.appendChild(tdDen);
    tr.appendChild(tdCoord);

    tbody.appendChild(tr);
  });
}

// Pornim încărcarea peșterilor pentru CodB1 primit din URL
incarcaPesteri(window.codB1);
