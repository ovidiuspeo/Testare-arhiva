// 1. Funcția care afișează tabelul (ACTUALIZATĂ pentru link-uri) v.1.10
function renderTable(rows, coloaneDeAfisat) {
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
    if (filterRow) filterRow.remove(); // dacă există deja, îl recreăm

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

    // 1.2. Generăm Rândurile
    rows.forEach(r => {
        const tr = document.createElement("tr");
        
        coloaneDeAfisat.forEach(numeColoana => {
            const td = document.createElement("td");
            const valoare = r[numeColoana] ?? "";
            
            // Verificăm dacă această coloană trebuie să fie un link către un fișier
            if (configMedia[numeColoana] && valoare !== "") {
                const bucket = configMedia[numeColoana];
                const folderCodBazin = r['CodB1']; // Avem nevoie de CodB1 pentru subfolder
                
                const link = document.createElement("a");
                // Construim URL-ul public către fișier
                link.href = `https://uymmflfhpeurfiigeivh.supabase.co/storage/v1/object/public/${bucket}/${folderCodBazin}/${valoare}`;
                link.target = "_blank"; // Deschide în tab nou
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

            if (filtru !== "") {
                const text = cell.innerText.toLowerCase();
                if (!text.includes(filtru)) {
                    vizibil = false;
                }
            }
        });

// 2. Funcția apelată de butonul "Caută" (ACTUALIZATĂ pentru a cere CodB1)
async function loadBazin() {
    const cod = document.getElementById("bazin").value.trim();
    if (!cod) { alert("Introduceți un CodB1"); return; }

    if (!window.db_supa) {
        alert("Eroare: Conexiunea nu a fost stabilită.");
        return;
    }

    // 2.1. Coloane vizibile permanent
    const coloaneVizibile = ['NrP1', 'Var', 'Denumire'];

    // 2.2. Adăugăm coloanele selectate din checkbox-uri
    const checkboxuri = document.querySelectorAll('.coloana-db:checked');
    checkboxuri.forEach(cb => {
        coloaneVizibile.push(cb.value);
    });
    
    // 2.3. IMPORTANTE: Cerem CodB1 de la server chiar dacă nu e vizibilă în tabel,
    // pentru că avem nevoie de ea în renderTable pentru a construi URL-ul folderului.
    const coloaneDeCerut = Array.from(new Set(['CodB1', ...coloaneVizibile]));
    const listaSelect = coloaneDeCerut.map(c => `"${c}"`).join(',');

    const { data, error } = await window.db_supa
        .from('pesteri_versiuni')
        .select(listaSelect) 
        .eq('CodB1', cod)
        .order('NrP1', { ascending: true })
        .order( 'Var', { ascending: true });

    if (error) {
        console.error('Eroare:', error);
        alert("Eroare la încărcarea datelor.");
        return;
    }

    // 2.4. Afișăm tabelul cu coloanele vizibile alese
    renderTable(data, coloaneVizibile);
}

// 3. Selectie toate coloane
function toggleToateColoanele() {
    const checkboxuri = document.querySelectorAll('.coloana-db');
    const oricareBifat = Array.from(checkboxuri).some(cb => cb.checked);
    checkboxuri.forEach(cb => {
        cb.checked = !oricareBifat;
    });
}

        row.style.display = vizibil ? "" : "none";
    });
}

