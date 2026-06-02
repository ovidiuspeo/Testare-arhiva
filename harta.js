/* Versiunea 1.25 — Harta bazinului */

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

  afiseazaInTabel(data);
}

// -------------------------------------------------------------
// 5. Afișare în tabelul din dreapta
// -------------------------------------------------------------
function afiseazaInTabel(lista) {
  const tbody = document.querySelector("#tabelPesteri tbody");
  tbody.innerHTML = "";

  const nrp1Vazute = new Set(); // ținem evidența NrP1 deja afișate

  lista.forEach(r => {
    if (nrp1Vazute.has(r.NrP1)) {
      return; // dacă NrP1 a fost deja afișat, îl sărim
    }

    nrp1Vazute.add(r.NrP1); // marcăm NrP1 ca afișat

    const tr = document.createElement("tr");

    const tdNr = document.createElement("td");
    tdNr.textContent = r.NrP1;

    const tdDen = document.createElement("td");
    tdDen.textContent = r.Denumire;

    tr.appendChild(tdNr);
    tr.appendChild(tdDen);

    tbody.appendChild(tr);
  });
}

// Pornim încărcarea peșterilor pentru CodB1 primit din URL
incarcaPesteri(window.codB1);
