// ==================== MÓDULO: FILE LOADER ====================
const FileLoader = (function() {
    
    function carregarCSV(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n');
            if (lines.length === 0) return;
            
            const headers = lines[0].split(';').map(h => h.trim().replace(/^\uFEFF/, ''));
            const rows = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(';');
                const row = {};
                headers.forEach((h, idx) => { 
                    row[h] = values[idx] || ''; 
                });
                rows.push(row);
            }
            callback(rows);
        };
        reader.readAsText(file, 'UTF-8');
    }

    function carregarBaseSaldo(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n');
            const saldo = { PBR: 0, CHEP: 0, QUEBRADO: 0, DESCARTAVEL: 0 };
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(';');
                const tipo = values[0]?.trim().toUpperCase();
                const quantidade = parseInt(values[1]) || 0;
                
                if (tipo === "PBR") saldo.PBR = quantidade;
                else if (tipo === "CHEP") saldo.CHEP = quantidade;
                else if (tipo === "QUEBRADO") saldo.QUEBRADO = quantidade;
                else if (tipo === "DESCARTAVEL") saldo.DESCARTAVEL = quantidade;
            }
            callback(saldo);
        };
        reader.readAsText(file, 'UTF-8');
    }

    return { carregarCSV, carregarBaseSaldo };
})();