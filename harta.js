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

  lista.forEach(r => {
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
