// -------------------------------------------------------------
// 1. Funcția care afișează tabelul (cu link-uri semnate + filtrare) v1.30
// -------------------------------------------------------------
async function renderTable(rows, coloaneDeAfisat) {
    const thead = document.querySelector("#tabelPesteri thead");
    const theadRow = document.querySelector("#tabelPesteri thead tr");
    const tbody = document.querySelector("#tabelPesteri tbody");

    theadRow.innerHTML = "";
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>Nu s-au găsit date.</td></tr>";
        return;
    }

    // Configurație pentru link-uri: Coloana -> Bucket
    const configMedia = {
        'num_alt': 'diverse',
        'num_foto': 'intrari',
        'num_sch': 'schite',
        'num_loc': 'localizari',
        'num_map': 'harti'
    };

    // 1.1. Generăm Header-ul
    coloaneDeAfisat.forEach(numeColoana => {
        const th = document.createElement("th");
        th.textContent = numeColoana;
        theadRow.appendChild(th);
    });

    // ---------------------------------------------------------
    // 🔍 FILTRARE: Adăugăm un rând cu input-uri sub header
    // ---------------------------------------------------------
    let filterRow = document.querySelector("#tabelPesteri thead tr.filter-row");
    if (filterRow) filterRow.remove();

    filterRow = document.createElement("tr");
    filterRow.classList.add("filter-row");

    coloaneDeAfisat.forEach(col => {
        const th = document.createElement("th");
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Filtru...";
        input.dataset.col = col;

        input.addEventListener("input", () => aplicaFiltre());

        th.appendChild(input);
        filterRow.appendChild(th);
    });

    thead.appendChild(filterRow);

    // ---------------------------------------------------------
    // 1.2. Generăm Rândurile (cu URL-uri semnate)
    // ---------------------------------------------------------
    for (const r of rows) {
        const tr = document.createElement("tr");

        for (const numeColoana of coloaneDeAfisat) {
            const td = document.createElement("td");
            const valoare = r[numeColoana] ?? "";

            // Dacă este coloană media → generăm URL semnat
            if (configMedia[numeColoana] && valoare !== "") {
                const bucket = configMedia[numeColoana];
                const folderCodBazin = r['CodB1'];

                // Generăm URL semnat
                const { data: signed, error: errSigned } = await window.db_supa
                    .storage
                    .from(bucket)
                    .createSignedUrl(`${folderCodBazin}/${valoare}`, 3600);

                if (errSigned) {
                    console.error("Eroare URL semnat:", errSigned);
                    td.textContent = valoare;
                } else {
                    const link = document.createElement("a");
                    link.href = signed.signedUrl;
                    link.target = "_blank";
                    link.textContent = valoare;
                    link.style.color = "blue";
                    link.style.textDecoration = "underline";
                    td.appendChild(link);
                }
            } else {
                td.textContent = valoare;
            }

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
}

// -------------------------------------------------------------
// 1.3. Funcția de filtrare pe coloane
// -------------------------------------------------------------
function aplicaFiltre() {
    const tbody = document.querySelector("#tabelPesteri tbody");
    const filtre = document.querySelectorAll(".filter-row input");

    const valoriFiltre = {};
    filtre.forEach(f => {
        valoriFiltre[f.dataset.col] = f.value.trim().toLowerCase();
    });

    Array.from(tbody.rows).forEach(row => {
        let vizibil = true;

        Array.from(row.cells).forEach((cell, index) => {
            const colName = filtre[index].dataset.col;
            const filtru = valoriFiltre[colName];
            if (filtru === "") return;

            const text = cell.innerText.toLowerCase();
            const numericCell = parseFloat(text);

            // Interval: "10-20"
            if (/^\d+\s*-\s*\d+$/.test(filtru)) {
                const [min, max] = filtru.split("-").map(v => parseFloat(v));
                if (isNaN(numericCell) || numericCell < min || numericCell > max) {
                    vizibil = false;
                }
                return;
            }

            // Operatori: >, <, >=, <=
            if (/^(>=|<=|>|<)\s*\d+(\.\d+)?$/.test(filtru)) {
                const op = filtru.match(/>=|<=|>|</)[0];
                const val = parseFloat(filtru.replace(op, ""));

                if (isNaN(numericCell)) {
                    vizibil = false;
                    return;
                }

                if (op === ">"  && !(numericCell >  val)) vizibil = false;
                if (op === "<"  && !(numericCell <  val)) vizibil = false;
                if (op === ">=" && !(numericCell >= val)) vizibil = false;
                if (op === "<=" && !(numericCell <= val)) vizibil = false;

                return;
            }

            // Egalitate numerică
            if (!isNaN(parseFloat(filtru))) {
                const val = parseFloat(filtru);
                if (isNaN(numericCell) || numericCell !== val) {
                    vizibil = false;
                }
                return;
            }

            // Filtrare text
            if (!text.includes(filtru)) {
                vizibil = false;
            }
        });

        row.style.display = vizibil ? "" : "none";
    });
}

// -------------------------------------------------------------
// 2. Funcția apelată de butonul "Caută"
// -------------------------------------------------------------
async function loadBazin() {
    const cod = document.getElementById("bazin").value.trim();
    if (!cod) { alert("Introduceți un CodB1"); return; }

    if (!window.db_supa) {
        alert("Eroare: Conexiunea nu a fost stabilită.");
        return;
    }

    const coloaneVizibile = ['NrP1', 'Var', 'Denumire'];

    const checkboxuri = document.querySelectorAll('.coloana-db:checked');
    checkboxuri.forEach(cb => {
        coloaneVizibile.push(cb.value);
    });

    const coloaneDeCerut = Array.from(new Set(['CodB1', ...coloaneVizibile]));
    const listaSelect = coloaneDeCerut.map(c => `"${c}"`).join(',');

    const { data, error } = await window.db_supa
        .from('pesteri_versiuni')
        .select(listaSelect)
        .eq('CodB1', cod)
        .order('NrP1', { ascending: true })
        .order('Var', { ascending: true });

    if (error) {
        console.error('Eroare:', error);
        alert("Eroare la încărcarea datelor.");
        return;
    }

    await renderTable(data, coloaneVizibile);
}

// -------------------------------------------------------------
// 3. Selectie toate coloanele
// -------------------------------------------------------------
function toggleToateColoanele() {
    const checkboxuri = document.querySelectorAll('.coloana-db');
    const oricareBifat = Array.from(checkboxuri).some(cb => cb.checked);

    checkboxuri.forEach(cb => {
        cb.checked = !oricareBifat;
    });
}

function resetFiltre() {
    const filtre = document.querySelectorAll(".filter-row input");
    filtre.forEach(f => f.value = "");

    aplicaFiltre();
}
