/* Versiunea 1.24 — Harta bazinului */
// -------------------------------------------------------------
// 2. Inițializare hartă
// -------------------------------------------------------------
const map = L.map('map').setView([45.75, 25.33], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

let markerSelectie = null;
let nrpSelectat = null;

// -------------------------------------------------------------
// 3. Încarcă peșterile dintr-un bazin
// -------------------------------------------------------------
async function incarcaPesteri(codB1) {
  document.getElementById("codB1Title").textContent = "CodB1: " + codB1;

  const { data, error } = await supa
    .from("pesteri_versiuni")
    .select("NrP1, Denumire, Latit, Long")
    .eq("CodB1", codB1)
    .order("NrP1", { ascending: true });

  if (error) {
    alert("Eroare la încărcare date.");
    console.error(error);
    return;
  }

  afiseazaPeHarta(data);
  afiseazaInTabel(data);
}

// -------------------------------------------------------------
// 4. Afișare pe hartă
// -------------------------------------------------------------
function afiseazaPeHarta(lista) {
  lista.forEach(r => {
    if (r.Latit && r.Long) {
      const m = L.marker([r.Latit, r.Long], { title: r.Denumire }).addTo(map);
      m.bindPopup(`<b>${r.Denumire}</b><br>NrP1: ${r.NrP1}<br>${r.Latit}, ${r.Long}`);
    }
  });
}

// -------------------------------------------------------------
// 5. Afișare în tabelul din dreapta
// -------------------------------------------------------------
function afiseazaInTabel(lista) {
  const tbody = document.querySelector("#tabelPesteri tbody");
  tbody.innerHTML = "";

  lista.forEach(r => {
    const tr = document.createElement("tr");

    const tdNr = document.createElement("td");
    tdNr.textContent = r.NrP1;

    const tdDen = document.createElement("td");
    tdDen.textContent = r.Denumire;

    const tdBtn = document.createElement("td");
    const btn = document.createElement("div");

    btn.classList.add("btn-marker");
    btn.classList.add(r.Latit && r.Long ? "verde" : "rosu");

    btn.addEventListener("click", () => incepeSelectiaCoordonate(r.NrP1));

    tdBtn.appendChild(btn);

    tr.appendChild(tdNr);
    tr.appendChild(tdDen);
    tr.appendChild(tdBtn);

    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 6. Modul selectare coordonate
// -------------------------------------------------------------
function incepeSelectiaCoordonate(nrp1) {
  nrpSelectat = nrp1;
  alert("Selectează un punct pe hartă pentru NrP1 = " + nrp1);

  map.once("click", e => {
    const { lat, lng } = e.latlng;

    if (markerSelectie) map.removeLayer(markerSelectie);

    markerSelectie = L.marker([lat, lng]).addTo(map);

    markerSelectie.bindPopup(`
      <b>Coordonate noi</b><br>
      Lat: <input id="latNou" value="${lat.toFixed(6)}"><br>
      Lon: <input id="lonNou" value="${lng.toFixed(6)}"><br><br>
      <button onclick="salveazaCoordonate()">Salvează</button>
      <button onclick="renuntaCoordonate()">Renunță</button>
    `).openPopup();
  });
}

// -------------------------------------------------------------
// 7. Salvare coordonate în Supabase
// -------------------------------------------------------------
async function salveazaCoordonate() {
  const lat = parseFloat(document.getElementById("latNou").value);
  const lon = parseFloat(document.getElementById("lonNou").value);

  const { error } = await supa
    .from("pesteri_versiuni")
    .update({ Latit: lat, Long: lon })
    .eq("NrP1", nrpSelectat);

  if (error) {
    alert("Eroare la salvare.");
    console.error(error);
    return;
  }

  alert("Coordonate salvate!");
  location.reload();
}

function renuntaCoordonate() {
  if (markerSelectie) map.removeLayer(markerSelectie);
  markerSelectie = null;
}
