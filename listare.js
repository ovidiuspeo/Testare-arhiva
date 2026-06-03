// ------------ v1.28 -----------------------------------------
// 1. Funcția care afișează tabelul (cu link-uri + filtrare) 
// -------------------------------------------------------------
function renderTable(rows, coloaneDeAfisat) {
    const thead = document.querySelector("#tabelPesteri thead");
    const theadRow = document.querySelector("#tabelPesteri thead tr");
    const tbody = document.querySelector("#tabelPesteri tbody");

    theadRow.innerHTML = "";
    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>Nu s-au găsit date.</td></tr>";
        return;
    }

    const configMedia = {
        'num_alt': 'diverse',
        'num_foto': 'intrari',
        'num_sch': 'schite',
        'num_loc': 'localizari',
        'num_map': 'harti'
    };

    // ---------------------------------------------------------
    // 1.1. Header
    // ---------------------------------------------------------

    // Coloana Sel
    const thSel = document.createElement("th");
    thSel.textContent = "Sel";
    thSel.dataset.coloana = "Sel";   // v1.28
    theadRow.appendChild(thSel);

    // Coloanele permanente + cele selectate
    coloaneDeAfisat.forEach(numeColoana => {
        const th = document.createElement("th");
        th.textContent = numeColoana;
        th.dataset.coloana = numeColoana;   // v1.28
        theadRow.appendChild(th);
    });

    // ---------------------------------------------------------
    // Filtrare
    // ---------------------------------------------------------
    let filterRow = document.querySelector("#tabelPesteri thead tr.filter-row");
    if (filterRow) filterRow.remove();

    filterRow = document.createElement("tr");
    filterRow.classList.add("filter-row");

    // Filtru gol pentru Sel
    const thSelFilter = document.createElement("th");
    filterRow.appendChild(thSelFilter);

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
    // 1.2. Rânduri
    // ---------------------------------------------------------
    rows.forEach(r => {
        const tr = document.createElement("tr");

        // Atribute necesare pentru selecție
        tr.dataset.nrp1 = r.NrP1;
        tr.dataset.var = r.Var || "";
        tr.dataset.denumire = r.Denumire || "";
        tr.dataset.latit = r.Latit || "";
        tr.dataset.long = r.Long || "";

        // Checkbox selecție
        const tdSel = document.createElement("td");
        tdSel.dataset.coloana = "Sel";   // v1.28
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.classList.add("chkPestera");
        tdSel.appendChild(chk);
        tr.appendChild(tdSel);

        // Restul coloanelor
        coloaneDeAfisat.forEach(numeColoana => {
            const td = document.createElement("td");
            td.dataset.coloana = numeColoana;   // v1.28
            const valoare = r[numeColoana] ?? "";

            if (configMedia[numeColoana] && valoare !== "") {
                const bucket = configMedia[numeColoana];
                const folderCodBazin = r['CodB1'];

                const link = document.createElement("a");
                link.href = `https://uymmflfhpeurfiigeivh.supabase.co/storage/v1/object/public/${bucket}/${folderCodBazin}/${valoare}`;
                link.target = "_blank";
                link.textContent = valoare;
                link.style.color = "blue";
                link.style.textDecoration = "underline";

                td.appendChild(link);
            } else {
                td.textContent = valoare;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// -------------------------------------------------------------
// 1.3. Filtrare
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
            if (index === 0) return; // Sel

            const colName = filtre[index - 1].dataset.col;
            const filtru = valoriFiltre[colName];
            if (filtru === "") return;

            const text = cell.innerText.toLowerCase();
            const numericCell = parseFloat(text);

            if (/^\d+\s*-\s*\d+$/.test(filtru)) {
                const [min, max] = filtru.split("-").map(v => parseFloat(v));
                if (isNaN(numericCell) || numericCell < min || numericCell > max) vizibil = false;
                return;
            }

            if (/^(>=|<=|>|<)\s*\d+(\.\d+)?$/.test(filtru)) {
                const op = filtru.match(/>=|<=|>|</)[0];
                const val = parseFloat(filtru.replace(op, ""));
                if (isNaN(numericCell)) { vizibil = false; return; }

                if (op === ">"  && !(numericCell >  val)) vizibil = false;
                if (op === "<"  && !(numericCell <  val)) vizibil = false;
                if (op === ">=" && !(numericCell >= val)) vizibil = false;
                if (op === "<=" && !(numericCell <= val)) vizibil = false;
                return;
            }

            if (!isNaN(parseFloat(filtru))) {
                const val = parseFloat(filtru);
                if (isNaN(numericCell) || numericCell !== val) vizibil = false;
                return;
            }

            if (!text.includes(filtru)) vizibil = false;
        });

        row.style.display = vizibil ? "" : "none";
    });
}

// -------------------------------------------------------------
// 1.4. Trimite selecția către hartă
// -------------------------------------------------------------
function arataHartaSelectie() {
    const selectate = obtinePesteriSelectate();

    if (!selectate || selectate.length === 0) {
        alert("Nu ai selectat nicio peșteră.");
        return;
    }

    localStorage.setItem("selectiePesteri", JSON.stringify(selectate));
    location.href = "harta.html?mode=selectie";
}

// -------------------------------------------------------------
// 1.5. Citește selecția
// -------------------------------------------------------------
function obtinePesteriSelectate() {
    const selectate = [];
    const checkboxes = document.querySelectorAll(".chkPestera:checked");

    checkboxes.forEach(chk => {
        const tr = chk.closest("tr");

        const r = {
            NrP1: tr.dataset.nrp1,
            Var: tr.dataset.var || "",
            Denumire: tr.dataset.denumire,
            Latit: tr.dataset.latit ? parseFloat(tr.dataset.latit) : null,
            Long: tr.dataset.long ? parseFloat(tr.dataset.long) : null
        };

        selectate.push(r);
    });

    return selectate;
}

// -------------------------------------------------------------
// 2. Caută
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
    checkboxuri.forEach(cb => coloaneVizibile.push(cb.value));

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

    renderTable(data, coloaneVizibile);
}

// -------------------------------------------------------------
// 3. Selectează toate coloanele
// -------------------------------------------------------------
function toggleToateColoanele() {
    const checkboxuri = document.querySelectorAll('.coloana-db');
    const oricareBifat = Array.from(checkboxuri).some(cb => cb.checked);
    checkboxuri.forEach(cb => cb.checked = !oricareBifat);
}

// -------------------------------------------------------------
// 4. Selectează / deselectează pe grupe
// -------------------------------------------------------------
function toggleGrupa(numeGrupa) {
    const fieldset = document.querySelector(`fieldset[data-grupa="${numeGrupa}"]`);
    const checkboxuri = fieldset.querySelectorAll('input[type="checkbox"]');
    const oricareBifat = Array.from(checkboxuri).some(cb => cb.checked);
    checkboxuri.forEach(cb => cb.checked = !oricareBifat);
}

// -------------------------------------------------------------
// 5. Reset filtre
// -------------------------------------------------------------
function resetFiltre() {
    const filtre = document.querySelectorAll(".filter-row input");
    filtre.forEach(f => f.value = "");
    aplicaFiltre();
}
