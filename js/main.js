// ==================== MODULO: MAIN (Inicializacao e Estado Global) ====================

let usuarioAtual = 'Operacao';
let timersAtivos = {};

function showToast(msg, isError) {
    if (isError === undefined) isError = false;
    var existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast-message';
    if (isError) toast.style.background = '#dc2626';
    toast.innerHTML = '<i class="fas ' + (isError ? 'fa-exclamation-triangle' : 'fa-info-circle') + '"></i> ' + msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

function showLoading(containerId) {
    var container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; padding: 60px;"><div class="loading-spinner"></div><span style="margin-left: 12px;">Processando dados...</span></div>';
    }
}

function inicializarUsuario() {
    var usuario = localStorage.getItem('estoqueon_usuario');
    if (!usuario) {
        usuario = prompt('Digite seu nome para registro das operacoes:', 'Operacao CD910');
        if (usuario) {
            localStorage.setItem('estoqueon_usuario', usuario);
        } else {
            usuario = 'Operacao';
        }
    }
    usuarioAtual = usuario;
    return usuarioAtual;
}

function isHoje(dataISO) {
    var data = new Date(dataISO);
    var hoje = new Date();
    return data.getDate() === hoje.getDate() &&
           data.getMonth() === hoje.getMonth() &&
           data.getFullYear() === hoje.getFullYear();
}

function formatarTempoRestante(milissegundos) {
    if (milissegundos <= 0) return 'SLA EXPIRADO!';
    var horas = Math.floor(milissegundos / (1000 * 60 * 60));
    var minutos = Math.floor((milissegundos % (1000 * 60 * 60)) / (1000 * 60));
    if (horas > 0) {
        return horas + 'h ' + minutos + 'min';
    }
    return minutos + 'min';
}

function pararTimer(idAgendamento) {
    if (timersAtivos[idAgendamento]) {
        clearInterval(timersAtivos[idAgendamento]);
        delete timersAtivos[idAgendamento];
    }
}

function iniciarTimer(idAgendamento, horaChegadaDoca) {
    pararTimer(idAgendamento);
    var timer = setInterval(function() {
        var activeMenu = document.querySelector('.nav-item.active');
        if (activeMenu && activeMenu.getAttribute('data-menu') === 'monitor') {
            renderizarMonitorSLACompleto();
        }
    }, 1000);
    timersAtivos[idAgendamento] = timer;
}

// ==================== FUNCOES DE AUTENTICACAO E LOGIN ====================

function renderizarTelaLogin() {
    var container = document.getElementById('appContainer');
    if (!container) return;
    
    var html = `
        <div class="login-container">
            <div class="login-card">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: center; margin-bottom: 16px;">
                        <img src="assets/logo.png" alt="Logo" style="height: 70px; width: auto; border-radius: 12px;" onerror="this.style.display='none'; this.parentNode.insertAdjacentHTML('afterbegin', '<div style=\'width:60px;height:60px;background:#2c5f8a;border-radius:16px;display:flex;align-items:center;justify-content:center\'><i class=\'fas fa-boxes\' style=\'color:white;font-size:28px;\'></i></div>')">
                    </div>
                    <h2 style="color: #1e3a5f; margin: 0; font-size: 1.6rem;">EstoqueOn</h2>
                    <p style="color: #6c8d9b; margin-top: 8px; font-size: 0.8rem;">Reversa de Paletes - CD910<br>Arujá - SP</p>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1e3a5f; font-size: 0.85rem;">Matrícula</label>
                    <input type="text" id="loginMatricula" class="login-input" placeholder="Digite sua matrícula">
                </div>
                
                <div style="margin-top: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #1e3a5f; font-size: 0.85rem;">Senha</label>
                    <input type="password" id="loginSenha" class="login-input" placeholder="Digite sua senha">
                </div>
                
                <button id="btnLogin" class="login-btn" style="margin-top: 24px;">Entrar</button>
                
                <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eef2f8; font-size: 0.7rem; color: #6c8d9b;">
                    <i class="fas fa-chart-line"></i> EstoqueOn - CD910 | Desenvolvido por Lucas Costa®
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('btnLogin').addEventListener('click', function() {
        var matricula = document.getElementById('loginMatricula').value;
        var senha = document.getElementById('loginSenha').value;
        
        if (!matricula || !senha) {
            alert('Preencha matrícula e senha!');
            return;
        }
        
        var usuario = Auth.login(matricula, senha);
        if (usuario) {
            usuarioAtual = usuario.nome;
            renderizarSistema();
        } else {
            alert('Matrícula ou senha incorretos!');
        }
    });
    
    document.getElementById('loginSenha').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('btnLogin').click();
        }
    });
}

function renderizarSistema() {
    var container = document.getElementById('appContainer');
    if (!container) return;
    
    var usuario = Auth.getUsuarioLogado();
    var modulosVisiveis = Auth.getModulosVisiveis();
    
    var menuItems = '';
    for (var i = 0; i < modulosVisiveis.length; i++) {
        var modulo = modulosVisiveis[i];
        var icone = '';
        var nome = '';
        
        if (modulo === 'dashboard') { icone = 'fa-tachometer-alt'; nome = 'Dashboard'; }
        else if (modulo === 'agendamentos') { icone = 'fa-calendar-alt'; nome = 'Agendamentos'; }
        else if (modulo === 'saldo') { icone = 'fa-boxes'; nome = 'Saldo Paletes'; }
        else if (modulo === 'monitor') { icone = 'fa-clock'; nome = 'Monitor SLA'; }
        else if (modulo === 'historico') { icone = 'fa-history'; nome = 'Histórico'; }
        else if (modulo === 'admin') { icone = 'fa-user-shield'; nome = 'Admin'; }
        else if (modulo === 'reset') { icone = 'fa-sync-alt'; nome = 'Resetar'; }
        
        var activeClass = (i === 0) ? 'active' : '';
        menuItems += '<div class="nav-item ' + activeClass + '" data-menu="' + modulo + '"><i class="fas ' + icone + '"></i> <span>' + nome + '</span></div>';
    }
    
    // Verificar se o usuário é admin para mostrar os botões de importar/exportar
    var isAdmin = usuario.tipo === 'admin';
    var botoesUpload = '';
    if (isAdmin) {
        botoesUpload = `
            <div class="upload-area">
                <input type="file" id="fileInputAgenda" accept=".csv" style="display:none">
                <button class="upload-btn" id="uploadBtnAgenda"><i class="fas fa-upload"></i> Importar Agenda CSV</button>
                <span id="fileStatusAgenda" class="file-status">Nenhum</span>
            </div>
            <div class="upload-area">
                <button class="upload-btn upload-btn-secondary" id="exportBtn"><i class="fas fa-download"></i> Exportar Dados</button>
            </div>
        `;
    } else {
        botoesUpload = `
            <div class="upload-area" style="background: #f0f2f5; cursor: not-allowed;">
                <span class="file-status" style="color: #9ca3af;"><i class="fas fa-lock"></i> Apenas Admin</span>
            </div>
        `;
    }
    
    var html = `
        <div class="app-container">
            <div class="sidebar">
                <div class="logo-area">
                    <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                        <img src="assets/logo.png" alt="Logo" style="height: 48px; width: auto; border-radius: 8px;" onerror="this.style.display='none'; this.parentNode.insertAdjacentHTML('afterbegin', '<div style=\'width:48px;height:48px;background:#2c5f8a;border-radius:12px;display:flex;align-items:center;justify-content:center\'><i class=\'fas fa-boxes\' style=\'color:white;font-size:24px;\'></i></div>')">
                    </div>
                    <p>Reversa de Paletes<br>Arujá - SP</p>
                    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.12); text-align: center; font-size: 0.7rem;">
                        <i class="fas fa-user"></i> ${usuario.nome} (${usuario.tipo})
                        <button id="btnLogout" style="background: none; border: none; color: #9bb8d4; cursor: pointer; margin-left: 8px;">
                            <i class="fas fa-sign-out-alt"></i> Sair
                        </button>
                    </div>
                </div>
                <div class="nav-menu">
                    ${menuItems}
                    <div class="nav-divider"></div>
                </div>
            </div>
            <div class="main-content" id="mainContent">
                <div class="report-header">
                    <h1><i class="fas fa-chart-simple"></i> Reversa de Paletes - CD910</h1>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${botoesUpload}
                    </div>
                </div>
                <div id="dynamicContent">
                    <div class="card" style="text-align:center; padding:60px;">
                        <i class="fas fa-cloud-upload-alt" style="font-size:48px; color:#2c5f8a;"></i>
                        <h3 style="margin-top:20px;">Carregue as bases de dados</h3>
                        <p style="margin-top:10px; color:#6c8d9b;">Base de Agendamentos (formato base_retirada)</p>
                        ${!isAdmin ? '<p style="margin-top:8px; color:#d97706;"><i class="fas fa-lock"></i> Apenas administradores podem importar dados</p>' : ''}
                    </div>
                </div>
                <footer>EstoqueOn - CD910 | Desenvolvido por Lucas Costa®</footer>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Eventos apenas se for admin
    if (isAdmin) {
        var logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                Auth.logout();
                renderizarTelaLogin();
            });
        }
        
        var uploadBtn = document.getElementById('uploadBtnAgenda');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function() {
                document.getElementById('fileInputAgenda').click();
            });
        }
        
        var fileInput = document.getElementById('fileInputAgenda');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                if (e.target.files[0]) {
                    showLoading('dynamicContent');
                    importarAgendaCSV(e.target.files[0]);
                }
            });
        }
        
        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportarDados();
            });
        }
    } else {
        // Apenas o logout para operadores
        var logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                Auth.logout();
                renderizarTelaLogin();
            });
        }
    }
    
    // Navegação do menu (comum a todos)
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(function(nav) {
                nav.classList.remove('active');
            });
            item.classList.add('active');
            
            var menu = item.getAttribute('data-menu');
            if (!Auth.temAcesso(menu)) {
                showToast('Você não tem acesso a este módulo!', true);
                return;
            }
            
            if (menu === 'dashboard') renderizarDashboardPrincipal();
            else if (menu === 'agendamentos') renderizarAgendamentos();
            else if (menu === 'saldo') renderizarSaldoPaletes();
            else if (menu === 'monitor') renderizarMonitorSLACompleto();
            else if (menu === 'historico') renderizarHistorico();
            else if (menu === 'admin') renderizarAdminPainel();
            else if (menu === 'reset') resetarSistema();
        });
    });
    
    // Carregar dashboard padrão
    if (Auth.temAcesso('dashboard')) {
        renderizarDashboardPrincipal();
    } else if (modulosVisiveis.length > 0) {
        var primeiroMenu = document.querySelector('.nav-item');
        if (primeiroMenu) primeiroMenu.click();
    }
}

// ==================== TELA DE ADMIN ====================
function renderizarAdminPainel() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var usuarios = Auth.listarUsuarios();
    var modulosDisponiveis = Auth.getModulosDisponiveis();
    
    var html = `
        <div class="card">
            <div class="card-title"><i class="fas fa-user-shield"></i> Gerenciar Usuários</div>
            
            <h3 style="margin: 20px 0 16px; color: #1e3a5f; font-size: 1rem;">Adicionar Novo Usuário</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 600; color: #1e3a5f;">Matrícula</label>
                    <input type="text" id="novoMatricula" placeholder="Digite a matrícula" class="upload-btn" style="width: 100%; padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.85rem; color: #1e293b;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 600; color: #1e3a5f;">Nome</label>
                    <input type="text" id="novoNome" placeholder="Digite o nome completo" class="upload-btn" style="width: 100%; padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.85rem; color: #1e293b;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 600; color: #1e3a5f;">Senha</label>
                    <input type="password" id="novaSenha" placeholder="Digite a senha" class="upload-btn" style="width: 100%; padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.85rem; color: #1e293b;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 600; color: #1e3a5f;">Módulos de Acesso</label>
                    <select id="novosModulos" multiple style="width: 100%; height: 80px; background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px; color: #1e293b; font-size: 0.8rem;">
                        ${modulosDisponiveis.map(function(m) {
                            return '<option value="' + m.id + '">' + m.nome + '</option>';
                        }).join('')}
                    </select>
                    <div style="font-size: 0.65rem; color: #6c8d9b; margin-top: 4px;">Segure Ctrl para selecionar múltiplos</div>
                </div>
                <div style="display: flex; align-items: flex-end;">
                    <button class="upload-btn" id="btnAdicionarUsuario" style="background: #2c5f8a; padding: 12px 20px; width: 100%;">Adicionar Usuário</button>
                </div>
            </div>
            
            <h3 style="margin: 24px 0 16px; color: #1e3a5f; font-size: 1rem;">Usuários Cadastrados</h3>
            <div style="overflow-x: auto; border-radius: 16px; border: 1px solid #eef2f8;">
                <table style="width: 100%; font-size: 0.8rem;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; background: #f8fafc;">Matrícula</th>
                            <th style="padding: 12px; background: #f8fafc;">Nome</th>
                            <th style="padding: 12px; background: #f8fafc;">Tipo</th>
                            <th style="padding: 12px; background: #f8fafc;">Módulos</th>
                            <th style="padding: 12px; background: #f8fafc;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.map(function(u) {
                            var modulosTexto = u.modulos && u.modulos.length ? u.modulos.join(', ') : 'Todos';
                            var isAdmin = u.matricula === 'admin';
                            return '<tr>' +
                                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;">' + u.matricula + '<\/td>' +
                                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;"><strong>' + (u.nome || '-') + '<\/strong><\/td>' +
                                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;"><span class="badge ' + (u.tipo === 'admin' ? 'badge-danger' : 'badge-success') + '">' + u.tipo + '<\/span><\/td>' +
                                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8; font-size: 0.7rem;">' + modulosTexto + '<\/td>' +
                                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;">' + 
                                (isAdmin ? '<span class="badge" style="background:#6c8d9b;">Sistema</span>' : 
                                '<button class="upload-btn" onclick="window.editarUsuario(\'' + u.matricula + '\')" style="background:#d97706; padding: 6px 14px; font-size: 0.7rem; margin-right: 6px;">Editar</button>' +
                                '<button class="upload-btn" onclick="window.removerUsuario(\'' + u.matricula + '\')" style="background:#dc2626; padding: 6px 14px; font-size: 0.7rem;">Remover</button>') + 
                                '<\/td>' +
                                '<\/tr>';
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Modal de Edição -->
        <div id="modalEditarUsuario" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:24px; padding:28px; width:500px; max-width:90%;">
                <h3 style="margin-bottom:20px; color:#1e3a5f;">Editar Usuário</h3>
                <input type="hidden" id="editMatriculaOriginal">
                <div style="margin-bottom:16px;">
                    <label style="display:block; margin-bottom:6px; font-weight:500;">Matrícula</label>
                    <input type="text" id="editMatricula" class="upload-btn" style="width:100%; padding:12px; background:white; border:1px solid #cbd5e1; border-radius:12px;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block; margin-bottom:6px; font-weight:500;">Nome</label>
                    <input type="text" id="editNome" class="upload-btn" style="width:100%; padding:12px; background:white; border:1px solid #cbd5e1; border-radius:12px;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block; margin-bottom:6px; font-weight:500;">Senha (deixe em branco para manter)</label>
                    <input type="password" id="editSenha" class="upload-btn" style="width:100%; padding:12px; background:white; border:1px solid #cbd5e1; border-radius:12px;">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:6px; font-weight:500;">Módulos de Acesso</label>
                    <select id="editModulos" multiple style="width:100%; height:100px; background:white; border:1px solid #cbd5e1; border-radius:12px; padding:8px;">
                        ${modulosDisponiveis.map(function(m) {
                            return '<option value="' + m.id + '">' + m.nome + '</option>';
                        }).join('')}
                    </select>
                    <div style="font-size:0.65rem; color:#6c8d9b; margin-top:4px;">Segure Ctrl para selecionar múltiplos</div>
                </div>
                <div style="display:flex; gap:12px; justify-content:flex-end;">
                    <button class="upload-btn" onclick="window.fecharModalEditar()" style="background:#6c8d9b;">Cancelar</button>
                    <button class="upload-btn" id="btnSalvarEdicao" style="background:#2c5f8a;">Salvar Alterações</button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Evento para adicionar usuário
    var btnAdicionar = document.getElementById('btnAdicionarUsuario');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', function() {
            var matricula = document.getElementById('novoMatricula').value;
            var nome = document.getElementById('novoNome').value;
            var senha = document.getElementById('novaSenha').value;
            var selectModulos = document.getElementById('novosModulos');
            var modulos = [];
            for (var i = 0; i < selectModulos.options.length; i++) {
                if (selectModulos.options[i].selected) {
                    modulos.push(selectModulos.options[i].value);
                }
            }
            
            if (!matricula || !nome || !senha) {
                showToast('Preencha todos os campos!', true);
                return;
            }
            
            if (Auth.adicionarUsuario(matricula, senha, nome, modulos)) {
                showToast('Usuário adicionado com sucesso!');
                document.getElementById('novoMatricula').value = '';
                document.getElementById('novoNome').value = '';
                document.getElementById('novaSenha').value = '';
                renderizarAdminPainel();
            } else {
                showToast('Matrícula já existe!', true);
            }
        });
    }
}

// Função global para abrir modal de edição
window.editarUsuario = function(matricula) {
    var usuario = Auth.buscarUsuario(matricula);
    if (!usuario) {
        showToast('Usuário não encontrado!', true);
        return;
    }
    
    document.getElementById('editMatriculaOriginal').value = matricula;
    document.getElementById('editMatricula').value = usuario.matricula;
    document.getElementById('editNome').value = usuario.nome || '';
    document.getElementById('editSenha').value = '';
    
    // Selecionar os módulos atuais do usuário
    var selectModulos = document.getElementById('editModulos');
    var modulosAtuais = usuario.modulos || [];
    for (var i = 0; i < selectModulos.options.length; i++) {
        selectModulos.options[i].selected = modulosAtuais.indexOf(selectModulos.options[i].value) !== -1;
    }
    
    var modal = document.getElementById('modalEditarUsuario');
    if (modal) modal.style.display = 'flex';
    
    // Evento de salvar edição
    var btnSalvar = document.getElementById('btnSalvarEdicao');
    if (btnSalvar) {
        // Remover evento anterior para evitar duplicação
        var novoBtn = btnSalvar.cloneNode(true);
        btnSalvar.parentNode.replaceChild(novoBtn, btnSalvar);
        
        novoBtn.addEventListener('click', function() {
            var matriculaOriginal = document.getElementById('editMatriculaOriginal').value;
            var novaMatricula = document.getElementById('editMatricula').value;
            var novoNome = document.getElementById('editNome').value;
            var novaSenha = document.getElementById('editSenha').value;
            var selectModulosEdit = document.getElementById('editModulos');
            var modulos = [];
            for (var j = 0; j < selectModulosEdit.options.length; j++) {
                if (selectModulosEdit.options[j].selected) {
                    modulos.push(selectModulosEdit.options[j].value);
                }
            }
            
            if (!novaMatricula || !novoNome) {
                showToast('Preencha matrícula e nome!', true);
                return;
            }
            
            var dadosEdicao = {
                matricula: novaMatricula,
                nome: novoNome,
                modulos: modulos
            };
            if (novaSenha && novaSenha.trim() !== '') {
                dadosEdicao.senha = novaSenha;
            }
            
            if (Auth.editarUsuario(matriculaOriginal, dadosEdicao)) {
                showToast('Usuário editado com sucesso!');
                window.fecharModalEditar();
                renderizarAdminPainel();
            } else {
                showToast('Erro ao editar usuário. Matrícula pode já existir!', true);
            }
        });
    }
};

// Função global para fechar modal
window.fecharModalEditar = function() {
    var modal = document.getElementById('modalEditarUsuario');
    if (modal) modal.style.display = 'none';
};

// Função global para remover usuário
window.removerUsuario = function(matricula) {
    if (confirm('Remover usuário ' + matricula + '?')) {
        if (Auth.removerUsuario(matricula)) {
            showToast('Usuário removido!');
            renderizarAdminPainel();
        } else {
            showToast('Erro ao remover usuário!', true);
        }
    }
};

// ==================== IMPORTAÇÃO DE AGENDA CSV ====================
function importarAgendaCSV(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var text = e.target.result;
        var lines = text.split('\n');
        if (lines.length === 0) return;
        
        var headers = lines[0].split(';').map(function(h) { 
            return h.trim().replace(/^\uFEFF/, ''); 
        });
        
        var agendamentos = [];
        
        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            var values = lines[i].split(';');
            var row = {};
            for (var h = 0; h < headers.length; h++) {
                row[headers[h]] = values[h] || '';
            }
            
            var senha = row['SENHA'];
            var fornecedor = row['FORNECEDOR'] || 'Desconhecido';
            var veiculo = row['VEIC. AGENDADO'] || row['VEIC_AGENDADO'] || 'CARRETA';
            var programado = parseInt(row['PROGRAMADO']) || 0;
            var retirado = parseInt(row['RETIRADO']) || 0;
            var quantidade = programado > 0 ? programado : (retirado > 0 ? retirado : 400);
            var status = row['STATUS'] || 'AGENDADO';
            var dataAgendaRaw = row['DATA/HORA AGENDA'] || row['DATAHORA_AGENDA'];
            
            var dataHora = new Date();
            if (dataAgendaRaw && dataAgendaRaw !== '31/12/1969 21:00') {
                var parts = dataAgendaRaw.split(' ');
                if (parts.length >= 2) {
                    var dateParts = parts[0].split('/');
                    var timeParts = parts[1].split(':');
                    if (dateParts.length === 3) {
                        dataHora = new Date(dateParts[2], dateParts[1]-1, dateParts[0], timeParts[0], timeParts[1]);
                    }
                }
            }
            
            agendamentos.push({
                senha: senha,
                fornecedor: fornecedor,
                veiculo: veiculo,
                quantidade: quantidade,
                dataHoraAgendada: dataHora.toISOString(),
                status: status
            });
        }
        
        var importados = AppState.importarAgendamentos(agendamentos);
        document.getElementById('fileStatusAgenda').innerHTML = '<i class="fas fa-check-circle"></i> ' + importados + ' agendas importadas de ' + agendamentos.length;
        showToast(importados + ' agendamentos importados com sucesso!');
        
        var activeMenu = document.querySelector('.nav-item.active');
        if (activeMenu) {
            var menu = activeMenu.getAttribute('data-menu');
            if (menu === 'dashboard') renderizarDashboardPrincipal();
            else if (menu === 'agendamentos') renderizarAgendamentos();
            else if (menu === 'historico') renderizarHistorico();
            else if (menu === 'monitor') renderizarMonitorSLACompleto();
            else renderizarDashboardPrincipal();
        } else {
            renderizarDashboardPrincipal();
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// ==================== TELA DASHBOARD ====================
function renderizarDashboardPrincipal() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var saldo = AppState.getSaldo();
    var agendamentos = AppState.getAgendamentos();
    var usuario = Auth.getUsuarioLogado();
    var isAdmin = usuario && usuario.tipo === 'admin';
    var emAndamento = [];
    var agendados = [];
    var finalizados = [];
    
    for (var i = 0; i < agendamentos.length; i++) {
        if (agendamentos[i].status === 'EM_ANDAMENTO') emAndamento.push(agendamentos[i]);
        else if (agendamentos[i].status === 'AGENDADO') agendados.push(agendamentos[i]);
        else if (agendamentos[i].status === 'FINALIZADO') finalizados.push(agendamentos[i]);
    }
    
    var totalDisponivel = (saldo.PBR || 0) + (saldo.CHEP || 0) + (saldo.DESCARTAVEL || 0);
    var slaCumpridos = 0;
    for (var f = 0; f < finalizados.length; f++) {
        if (finalizados[f].slaCumprido === true) slaCumpridos++;
    }
    var percSla = finalizados.length > 0 ? (slaCumpridos / finalizados.length * 100).toFixed(1) : 0;
    
    // Últimas 5 movimentações ordenadas por data de criação
    var todosOrdenados = agendamentos.slice().reverse();
    var ultimos5 = todosOrdenados.slice(0, 5);
    
    var html = '<div class="kpi-grid">' +
        '<div class="kpi-card"><div class="kpi-title">SALDO DISPONIVEL</div><div class="kpi-value">' + totalDisponivel.toLocaleString() + '</div><div class="kpi-sub">PBR + CHEP + Descartaveis</div></div>' +
        '<div class="kpi-card"><div class="kpi-title">EM ANDAMENTO</div><div class="kpi-value">' + emAndamento.length + '</div><div class="kpi-sub">operacoes ativas</div></div>' +
        '<div class="kpi-card"><div class="kpi-title">AGENDADOS</div><div class="kpi-value">' + agendados.length + '</div><div class="kpi-sub">aguardando inicio</div></div>' +
        '<div class="kpi-card"><div class="kpi-title">SLA CONFORMIDADE</div><div class="kpi-value">' + percSla + '%</div><div class="kpi-sub">' + slaCumpridos + '/' + finalizados.length + ' dentro do prazo</div></div>' +
        '</div>';
    
    html += '<div class="dashboard-grid">' +
        '<div class="card" style="padding: 16px 20px;"><div class="card-title" style="margin-bottom: 12px;">Saldo de Paletes</div>' +
        '<div class="saldo-item" style="padding: 8px 0;"><span class="saldo-tipo">PBR</span><span class="saldo-valor" style="color: #8B4513; font-size: 1.1rem;">' + saldo.PBR.toLocaleString() + '</span></div>' +
        '<div class="saldo-item" style="padding: 8px 0;"><span class="saldo-tipo">CHEP (PLT AZUL)</span><span class="saldo-valor" style="color: #2c5f8a; font-size: 1.1rem;">' + saldo.CHEP.toLocaleString() + '</span></div>' +
        '<div class="saldo-item" style="padding: 8px 0;"><span class="saldo-tipo">DESCARTAVEL</span><span class="saldo-valor" style="color: #2e7d32; font-size: 1.1rem;">' + saldo.DESCARTAVEL.toLocaleString() + '</span></div>' +
        '<div class="saldo-item" style="padding: 8px 0;"><span class="saldo-tipo">QUEBRADO</span><span class="saldo-valor" style="color: #6b7280; font-size: 1.1rem;">' + saldo.QUEBRADO.toLocaleString() + '</span></div>' +
        '<div class="file-status" style="margin-top: 12px; font-size: 0.65rem;">Ultima atualizacao: ' + (saldo.ultimaAtualizacao ? new Date(saldo.ultimaAtualizacao).toLocaleString() : 'Nunca') + '</div>' +
        '</div>' +
        '<div class="card"><div class="card-title">Ultimas Movimentacoes</div>';
    
    if (ultimos5.length > 0) {
        html += '<div style="overflow-x:auto;"><table style="width:100%; font-size: 0.75rem;">' +
            '<thead><tr><th>Senha</th><th>Fornecedor</th><th>Qtd</th><th>Tipo</th><th>Status</th><th>Data Agendada</th></tr></thead><tbody>';
        for (var u = 0; u < ultimos5.length; u++) {
            var a = ultimos5[u];
            var statusClass = '';
            if (a.status === 'FINALIZADO') statusClass = 'badge-success';
            else if (a.status === 'EM_ANDAMENTO') statusClass = 'badge-warning';
            else statusClass = 'badge-danger';
            
            // Determinar tipo de palete
            var tipoPalete = a.tipoPalete || AppState.getTipoPaletePorFornecedor(a.fornecedor);
            var tipoCor = '';
            var tipoIcone = '';
            if (tipoPalete === 'PBR') {
                tipoCor = 'background: #8B4513;';
                tipoIcone = '🟤';
            } else if (tipoPalete === 'CHEP') {
                tipoCor = 'background: #2c5f8a;';
                tipoIcone = '🔵';
            } else if (tipoPalete === 'DESCARTAVEL') {
                tipoCor = 'background: #2e7d32;';
                tipoIcone = '🟢';
            } else {
                tipoCor = 'background: #6b7280;';
                tipoIcone = '⚪';
            }
            
            // Formatar data do agendamento
            var dataAgendada = '-';
            if (a.dataHoraAgendada) {
                var dataObj = new Date(a.dataHoraAgendada);
                if (!isNaN(dataObj.getTime())) {
                    dataAgendada = dataObj.toLocaleDateString();
                }
            }
            
            html += '<tr>' +
                '<td style="padding: 8px 6px;">' + (a.senha || '-') + '</td>' +
                '<td style="padding: 8px 6px;"><strong>' + (a.fornecedor ? a.fornecedor.substring(0, 30) : '-') + '</strong></td>' +
                '<td style="padding: 8px 6px; text-align: center;">' + (a.quantidade ? a.quantidade.toLocaleString() : '-') + '</td>' +
                '<td style="padding: 8px 6px;"><span class="badge" style="' + tipoCor + ' color:white; padding: 2px 8px; font-size: 0.65rem;">' + tipoIcone + ' ' + tipoPalete + '</span></td>' +
                '<td style="padding: 8px 6px;"><span class="badge ' + statusClass + '" style="font-size: 0.65rem;">' + a.status + '</span></td>' +
                '<td style="padding: 8px 6px;">' + dataAgendada + '</td>' +
                '</tr>';
        }
        html += '</tbody></table></div>';
    } else {
        html += '<p style="text-align:center; padding:20px; font-size: 0.8rem;">Nenhuma movimentacao</p>';
    }
    
    html += '</div></div>';
    
    // Tabela de Operacoes em Andamento
    html += '<div class="card"><div class="card-title">Operacoes em Andamento</div>';
    if (emAndamento.length > 0) {
        html += '<div style="overflow-x:auto;"><table style="width:100%"><thead><tr><th>Senha</th><th>Fornecedor</th><th>Doca</th><th>Inicio</th><th>Tempo em Doca</th><th>Ação</th><tr></thead><tbody>';
        for (var e = 0; e < emAndamento.length; e++) {
            var a = emAndamento[e];
            var tempoDecorrido = Math.floor((new Date() - new Date(a.horaChegadaDoca)) / 60000);
            var tempoHoras = Math.floor(tempoDecorrido / 60);
            var tempoMinutos = tempoDecorrido % 60;
            var tempoText = '';
            if (tempoHoras > 0) {
                tempoText = tempoHoras + 'h ' + tempoMinutos + 'min';
            } else {
                tempoText = tempoMinutos + 'min';
            }
            html += '<tr>' +
                '<td style="padding: 10px 8px;">' + (a.senha || '-') + '</td>' +
                '<td style="padding: 10px 8px;">' + a.fornecedor + '</td>' +
                '<td style="padding: 10px 8px;"><span class="badge" style="background: #2c5f8a; color: white; padding: 4px 10px;">Doca ' + a.numeroDoca + '</span></td>' +
                '<td style="padding: 10px 8px;">' + new Date(a.horaChegadaDoca).toLocaleTimeString() + '</td>' +
                '<td style="padding: 10px 8px;">' + tempoText + '</td>' +
                '<td style="padding: 10px 8px;"><button class="upload-btn" onclick="window.concluirAgendamento(' + a.id + ')" style="padding: 4px 12px; font-size: 0.7rem;">Concluir</button></td>' +
                '</tr>';
        }
        html += '</tbody></table></div>';
    } else {
        html += '<p style="text-align:center; padding:20px;">Nenhuma operacao em andamento</p>';
    }
    
    // Botão "Acessar Monitor SLA Completo" - visível APENAS para Admin
    if (isAdmin) {
        html += '<div style="margin-top:16px; text-align:center;"><button class="upload-btn" onclick="document.querySelector(\'.nav-item[data-menu=monitor]\').click()" style="background:#d97706;">Acessar Monitor SLA Completo</button></div>';
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// ==================== TELA DE AGENDAMENTOS ====================
function renderizarAgendamentos() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var agendados = AppState.getAgendamentosPendentes();
    
    var html = '<div class="card">' +
        '<div class="card-title">Agendamentos Pendentes</div>' +
        '<div class="file-status" style="margin-bottom: 16px;">Total de agendamentos aguardando: ' + agendados.length + '</div>';
    
    if (agendados.length > 0) {
        html += '<div style="overflow-x:auto;">';
        html += '<table style="width:100%; border-collapse: collapse;">';
        html += '<thead>';
        html += '<tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">';
        html += '<th style="padding: 12px; text-align: left;">Senha</th>';
        html += '<th style="padding: 12px; text-align: left;">Fornecedor</th>';
        html += '<th style="padding: 12px; text-align: left;">Data/Hora</th>';
        html += '<th style="padding: 12px; text-align: left;">Veículo</th>';
        html += '<th style="padding: 12px; text-align: center;">Quantidade</th>';
        html += '<th style="padding: 12px; text-align: center;">Status</th>';
        html += '</td>';
        html += '</thead>';
        html += '<tbody>';
        
        for (var i = 0; i < agendados.length; i++) {
            var a = agendados[i];
            var dataHora = new Date(a.dataHoraAgendada);
            var dataFormatada = dataHora.toLocaleString();
            
            html += '<tr style="border-bottom: 1px solid #eef2f8;">';
            html += '<td style="padding: 12px;">' + (a.senha || '-') + '<\/td>';
            html += '<td style="padding: 12px;"><strong>' + a.fornecedor + '</strong><\/td>';
            html += '<td style="padding: 12px;">' + dataFormatada + '<\/td>';
            html += '<td style="padding: 12px;">' + a.veiculo + '<\/td>';
            html += '<td style="padding: 12px; text-align: center;">' + a.quantidade.toLocaleString() + '<\/td>';
            html += '<td style="padding: 12px; text-align: center;"><span class="badge badge-warning">' + a.status + '<\/span><\/td>';
            html += '<\/tr>';
        }
        html += '</tbody>';
        html += '<\/table>';
        html += '<\/div>';
    } else {
        html += '<p style="text-align:center; padding:40px;">Nenhum agendamento pendente no momento</p>';
    }
    html += '<\/div>';
    container.innerHTML = html;
}

// ==================== TELA DE SALDO ====================
function renderizarSaldoPaletes() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var saldo = AppState.getSaldo();
    var totalDisponivel = (saldo.PBR || 0) + (saldo.CHEP || 0) + (saldo.DESCARTAVEL || 0);
    
    var html = '<div style="max-width: 800px; margin: 0 auto;">' +
        '<div class="card" style="border-radius: 24px; background: white;">' +
        '<div class="card-title" style="border-left-color: #2c5f8a; margin-bottom: 24px;">' +
        '<i class="fas fa-edit" style="color: #2c5f8a;"></i> Controle de Saldo de Paletes</div>' +
        '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">' +
        '<div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); border-radius: 20px; padding: 16px; text-align: center;">' +
        '<div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-bottom: 8px;">TOTAL DISPONÍVEL</div>' +
        '<div style="font-size: 1.8rem; font-weight: 800; color: white;">' + totalDisponivel.toLocaleString() + '</div>' +
        '<div style="font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-top: 4px;">paletes para coleta</div></div>' +
        '<div style="background: #f8fafc; border-radius: 20px; padding: 16px; text-align: center; border: 1px solid #eef2f8;">' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">Última atualização</div>' +
        '<div style="font-size: 0.8rem; font-weight: 600; color: #1e3a5f; margin-top: 4px;">' + (saldo.ultimaAtualizacao ? new Date(saldo.ultimaAtualizacao).toLocaleDateString() : 'Nunca') + '</div>' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">' + (saldo.ultimaAtualizacao ? new Date(saldo.ultimaAtualizacao).toLocaleTimeString() : '') + '</div></div>' +
        '<div style="background: #f8fafc; border-radius: 20px; padding: 16px; text-align: center; border: 1px solid #eef2f8;">' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">Atualizado por</div>' +
        '<div style="font-size: 0.9rem; font-weight: 600; color: #1e3a5f; margin-top: 4px;">' + (saldo.atualizadoPor || '-') + '</div></div>' +
        '</div>' +
        '<div style="background: #f8fafc; border-radius: 20px; padding: 20px; margin-bottom: 24px;">' +
        '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">' +
        '<i class="fas fa-pallet" style="color: #2c5f8a; font-size: 1.2rem;"></i>' +
        '<span style="font-weight: 600; color: #1e3a5f;">Editar Quantidades</span></div>' +
        '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">' +
        
        '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
        '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">' +
        '<div style="width: 40px; height: 40px; background: #8B4513; border-radius: 12px; display: flex; align-items: center; justify-content: center;">' +
        '<i class="fas fa-pallet" style="color: white; font-size: 1rem;"></i></div>' +
        '<div><div style="font-weight: 700; color: #8B4513;">PBR</div>' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">Palete Padrão</div></div></div>' +
        '<input type="number" id="saldoPBR" value="' + saldo.PBR + '" class="upload-btn" style="width: 100%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1.2rem; font-weight: 600; color: #8B4513; text-align: center;"></div>' +
        
        '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
        '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">' +
        '<div style="width: 40px; height: 40px; background: #2c5f8a; border-radius: 12px; display: flex; align-items: center; justify-content: center;">' +
        '<i class="fas fa-pallet" style="color: white; font-size: 1rem;"></i></div>' +
        '<div><div style="font-weight: 700; color: #2c5f8a;">CHEP</div>' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">PLT AZUL</div></div></div>' +
        '<input type="number" id="saldoCHEP" value="' + saldo.CHEP + '" class="upload-btn" style="width: 100%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1.2rem; font-weight: 600; color: #2c5f8a; text-align: center;"></div>' +
        
        '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
        '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">' +
        '<div style="width: 40px; height: 40px; background: #2e7d32; border-radius: 12px; display: flex; align-items: center; justify-content: center;">' +
        '<i class="fas fa-recycle" style="color: white; font-size: 1rem;"></i></div>' +
        '<div><div style="font-weight: 700; color: #2e7d32;">DESCARTÁVEL</div>' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">Descartável</div></div></div>' +
        '<input type="number" id="saldoDESC" value="' + saldo.DESCARTAVEL + '" class="upload-btn" style="width: 100%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1.2rem; font-weight: 600; color: #2e7d32; text-align: center;"></div>' +
        
        '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
        '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">' +
        '<div style="width: 40px; height: 40px; background: #6b7280; border-radius: 12px; display: flex; align-items: center; justify-content: center;">' +
        '<i class="fas fa-industry" style="color: white; font-size: 1rem;"></i></div>' +
        '<div><div style="font-weight: 700; color: #6b7280;">QUEBRADO</div>' +
        '<div style="font-size: 0.7rem; color: #6c8d9b;">Aguardando reforma</div></div></div>' +
        '<input type="number" id="saldoQUEB" value="' + saldo.QUEBRADO + '" class="upload-btn" style="width: 100%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1.2rem; font-weight: 600; color: #6b7280; text-align: center;"></div>' +
        
        '</div></div>' +
        '<div style="display: flex; gap: 16px; justify-content: flex-end;">' +
        '<button class="upload-btn" id="salvarSaldoBtn" style="background: #2c5f8a; padding: 12px 24px; display: flex; align-items: center; gap: 8px;"><i class="fas fa-save"></i> Salvar Alterações</button>' +
        '</div>' +
        '<div style="margin-top: 20px; padding: 12px; background: #eef2f8; border-radius: 12px; display: flex; align-items: center; gap: 12px;">' +
        '<i class="fas fa-info-circle" style="color: #2c5f8a; font-size: 0.9rem;"></i>' +
        '<span style="font-size: 0.75rem; color: #4a5568;">Os paletes PBR, CHEP e Descartáveis são considerados no saldo disponível para coleta. Paletes quebrados aguardam reforma e não entram no saldo disponível.</span>' +
        '</div></div></div>';
    
    container.innerHTML = html;
    
    var salvarBtn = document.getElementById('salvarSaldoBtn');
    if (salvarBtn) {
        salvarBtn.addEventListener('click', function() {
            var pbrInput = document.getElementById('saldoPBR');
            var chepInput = document.getElementById('saldoCHEP');
            var descInput = document.getElementById('saldoDESC');
            var quebInput = document.getElementById('saldoQUEB');
            
            if (!pbrInput || !chepInput || !descInput || !quebInput) {
                showToast('Erro ao ler os campos do formulário!', true);
                return;
            }
            
            var novoSaldo = {
                PBR: parseInt(pbrInput.value) || 0,
                CHEP: parseInt(chepInput.value) || 0,
                DESCARTAVEL: parseInt(descInput.value) || 0,
                QUEBRADO: parseInt(quebInput.value) || 0
            };
            
            var totalDisponivelNovo = novoSaldo.PBR + novoSaldo.CHEP + novoSaldo.DESCARTAVEL;
            
            if (confirm('Confirmar atualização do saldo?\n\nNovo saldo disponível para coleta: ' + totalDisponivelNovo.toLocaleString() + ' paletes\n\nPBR: ' + novoSaldo.PBR + '\nCHEP: ' + novoSaldo.CHEP + '\nDESCARTÁVEL: ' + novoSaldo.DESCARTAVEL + '\nQUEBRADO: ' + novoSaldo.QUEBRADO)) {
                AppState.atualizarSaldo(novoSaldo, usuarioAtual);
                showToast('✅ Saldo atualizado com sucesso!');
                renderizarSaldoPaletes();
            }
        });
    }
}

// ==================== TELA DE HISTORICO ====================
function renderizarHistorico() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var finalizados = AppState.getAgendamentosFinalizados();
    var cancelados = AppState.getAgendamentosCancelados();
    var todosHistorico = finalizados.concat(cancelados);
    todosHistorico.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    var slaCumpridos = 0;
    for (var f = 0; f < finalizados.length; f++) {
        if (finalizados[f].slaCumprido === true) slaCumpridos++;
    }
    var percSla = finalizados.length > 0 ? (slaCumpridos / finalizados.length * 100).toFixed(1) : 0;
    
    var html = '<div class="card"><div class="card-title">Indicadores de Performance</div>' +
        '<div class="stats-row">' +
        '<div class="stat-mini"><div class="stat-mini-value">' + finalizados.length + '</div><div>Total Finalizados</div></div>' +
        '<div class="stat-mini"><div class="stat-mini-value">' + slaCumpridos + '</div><div>SLA Cumprido (3h)</div></div>' +
        '<div class="stat-mini"><div class="stat-mini-value">' + percSla + '%</div><div>Taxa de Conformidade</div></div>' +
        '<div class="stat-mini"><div class="stat-mini-value">' + cancelados.length + '</div><div>Cancelados</div></div>' +
        '</div></div>';
    
    html += '<div class="card"><div class="card-title">Historico de Operacoes</div>';
    if (todosHistorico.length > 0) {
        html += '<div style="overflow-x:auto;"><table style="width:100%"><thead><tr>' +
            '<th>Senha</th>' +
            '<th>Fornecedor</th>' +
            '<th>Data Agendada</th>' +
            '<th>Qtd</th>' +
            '<th>Status</th>' +
            '<th>Tipo</th>' +
            '<th>Tempo Total</th>' +
            '<th>SLA 3h</th>' +
            '</thead><tbody>';
        
        for (var h = 0; h < todosHistorico.length; h++) {
            var a = todosHistorico[h];
            var statusClass = (a.status === 'FINALIZADO') ? 'badge-success' : 'badge-danger';
            var tipoPalete = a.tipoPalete || AppState.getTipoPaletePorFornecedor(a.fornecedor);
            
            // Definir cor do badge do tipo de palete
            var tipoCor = '';
            var tipoIcone = '';
            if (tipoPalete === 'PBR') {
                tipoCor = 'background: #8B4513;';
                tipoIcone = '🟤';
            } else if (tipoPalete === 'CHEP') {
                tipoCor = 'background: #2c5f8a;';
                tipoIcone = '🔵';
            } else if (tipoPalete === 'DESCARTAVEL') {
                tipoCor = 'background: #2e7d32;';
                tipoIcone = '🟢';
            } else {
                tipoCor = 'background: #6b7280;';
                tipoIcone = '⚪';
            }
            
            // Formatar data agendada
            var dataAgendada = '-';
            if (a.dataHoraAgendada) {
                var dataObj = new Date(a.dataHoraAgendada);
                if (!isNaN(dataObj.getTime())) {
                    dataAgendada = dataObj.toLocaleString();
                }
            }
            
            // Formatar tempo total
            var tempoTotalText = '-';
            if (a.tempoTotalMinutos) {
                var horas = Math.floor(a.tempoTotalMinutos / 60);
                var minutos = a.tempoTotalMinutos % 60;
                if (horas > 0) {
                    tempoTotalText = horas + 'h ' + minutos + 'min';
                } else {
                    tempoTotalText = minutos + 'min';
                }
            }
            
            // SLA
            var slaText = '-';
            if (a.slaCumprido === true) slaText = '✅ Sim';
            else if (a.slaCumprido === false) slaText = '❌ Não';
            
            html += '<tr>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;">' + (a.senha || '-') + '</td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;"><strong>' + (a.fornecedor || '-') + '</strong></td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;">' + dataAgendada + '</td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8; text-align: center;">' + (a.quantidade ? a.quantidade.toLocaleString() : '-') + '</td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;"><span class="badge ' + statusClass + '">' + a.status + '</span></td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8;"><span class="badge" style="' + tipoCor + ' color:white; padding: 4px 10px;">' + tipoIcone + ' ' + tipoPalete + '</span></td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8; text-align: center;">' + tempoTotalText + '</td>' +
                '<td style="padding: 12px; border-bottom: 1px solid #eef2f8; text-align: center;">' + slaText + '</td>' +
                '</tr>';
        }
        html += '</tbody></table></div>';
    } else {
        html += '<p style="text-align:center; padding:40px;">Nenhum registro no historico</p>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// ==================== TELA DE MONITOR SLA ====================

// ==================== FUNCOES GLOBAIS ====================
window.abrirModalDoca = function(id) {
    var modal = document.getElementById('modalDoca');
    if (modal) {
        document.getElementById('modalAgendamentoId').value = id;
        document.getElementById('modalNumeroDoca').value = '';
        document.getElementById('modalMotorista').value = '';
        modal.style.display = 'flex';
    }
};

window.fecharModalDoca = function() {
    var modal = document.getElementById('modalDoca');
    if (modal) modal.style.display = 'none';
};

window.confirmarRegistroDoca = function() {
    var id = document.getElementById('modalAgendamentoId').value;
    var numeroDoca = document.getElementById('modalNumeroDoca').value;
    if (!id || !numeroDoca) {
        showToast('Informe o numero da doca!', true);
        return;
    }
    var resultado = AppState.registrarChegadaDoca(parseInt(id), parseInt(numeroDoca), usuarioAtual);
    if (resultado) {
        showToast('Chegada na doca ' + numeroDoca + ' registrada! SLA de 3 horas iniciado.');
        window.fecharModalDoca();
        var activeMenu = document.querySelector('.nav-item.active');
        if (activeMenu && activeMenu.getAttribute('data-menu') === 'monitor') {
            renderizarMonitorSLACompleto();
        } else {
            renderizarDashboardPrincipal();
        }
    } else {
        showToast('Erro ao registrar chegada na doca!', true);
    }
};

window.concluirAgendamento = function(id) {
    var agendamentos = AppState.getAgendamentos();
    var agendamento = null;
    for (var i = 0; i < agendamentos.length; i++) {
        if (agendamentos[i].id === id) {
            agendamento = agendamentos[i];
            break;
        }
    }
    if (!agendamento) {
        showToast('Agendamento não encontrado!', true);
        return;
    }
    var tipoPalete = agendamento.tipoPalete || AppState.getTipoPaletePorFornecedor(agendamento.fornecedor);
    var quantidade = agendamento.quantidade;
    var saldo = AppState.getSaldo();
    var saldoDisponivel = 0;
    if (tipoPalete === 'PBR') saldoDisponivel = saldo.PBR;
    else if (tipoPalete === 'CHEP') saldoDisponivel = saldo.CHEP;
    else if (tipoPalete === 'QUEBRADO') saldoDisponivel = saldo.QUEBRADO;
    if (saldoDisponivel < quantidade) {
        alert('SALDO INSUFICIENTE!\n\nTipo: ' + tipoPalete + '\nNecessario: ' + quantidade + '\nDisponivel: ' + saldoDisponivel);
        return;
    }
    if (confirm('Confirmar conclusao?\n\nFornecedor: ' + agendamento.fornecedor + '\nTipo: ' + tipoPalete + '\nQuantidade: ' + quantidade + '\nSaldo apos baixa: ' + (saldoDisponivel - quantidade))) {
        var resultado = AppState.registrarConclusao(id, usuarioAtual);
        if (resultado && resultado.success) {
            pararTimer(id);
            showToast('Agendamento concluido! Baixa de ' + quantidade + ' paletes ' + tipoPalete);
            var activeMenu = document.querySelector('.nav-item.active');
            if (activeMenu && activeMenu.getAttribute('data-menu') === 'monitor') {
                renderizarMonitorSLACompleto();
            } else {
                renderizarDashboardPrincipal();
            }
        } else {
            showToast('Erro ao concluir! ' + (resultado ? resultado.error : ''), true);
        }
    }
};

function exportarDados() {
    var csv = AppState.exportarDadosCSV();
    if (!csv) {
        showToast('Nenhum dado para exportar', true);
        return;
    }
    var blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'reversa_paletes_' + new Date().toISOString().slice(0,19) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Dados exportados com sucesso!');
}

function resetarSistema() {
    if (confirm('ATENCAO! Isso apagara todos os agendamentos e saldos. Deseja continuar?')) {
        for (var id in timersAtivos) {
            clearInterval(timersAtivos[id]);
        }
        timersAtivos = {};
        AppState.resetarSistema();
        showToast('Sistema resetado com sucesso!');
        renderizarDashboardPrincipal();
        document.getElementById('fileStatusAgenda').innerHTML = 'Nenhum';
        document.getElementById('fileInputAgenda').value = '';
    }
}

// ==================== INICIALIZACAO ====================
if (Auth.isLogado()) {
    renderizarSistema();
} else {
    renderizarTelaLogin();
}
// ==================== FUNÇÕES DE ETAPAS ====================
window.avancarEtapa = function(id) {
    var agendamentos = AppState.getAgendamentos();
    var agendamento = null;
    var index = -1;
    for (var i = 0; i < agendamentos.length; i++) {
        if (agendamentos[i].id === id) {
            agendamento = agendamentos[i];
            index = i;
            break;
        }
    }
    if (!agendamento) { showToast('Agendamento não encontrado!', true); return; }
    var resultado = EtapasManager.avancarEtapa(agendamento, usuarioAtual);
    if (resultado.success) {
        agendamentos[index] = resultado.agendamento;
        AppState.persistirDados();
        showToast('✅ Avançado para: ' + resultado.etapa.nome);
        var activeMenu = document.querySelector('.nav-item.active');
        if (activeMenu && activeMenu.getAttribute('data-menu') === 'monitor') renderizarMonitorSLACompleto();
        renderizarDashboardPrincipal();
    } else { showToast(resultado.error, true); }
};

window.voltarEtapa = function(id) {
    var agendamentos = AppState.getAgendamentos();
    var agendamento = null;
    var index = -1;
    for (var i = 0; i < agendamentos.length; i++) {
        if (agendamentos[i].id === id) {
            agendamento = agendamentos[i];
            index = i;
            break;
        }
    }
    if (!agendamento) { showToast('Agendamento não encontrado!', true); return; }
    var resultado = EtapasManager.voltarEtapa(agendamento, usuarioAtual);
    if (resultado.success) {
        agendamentos[index] = resultado.agendamento;
        AppState.persistirDados();
        showToast('↺ Voltado para: ' + resultado.etapa.nome);
        var activeMenu = document.querySelector('.nav-item.active');
        if (activeMenu && activeMenu.getAttribute('data-menu') === 'monitor') renderizarMonitorSLACompleto();
        renderizarDashboardPrincipal();
    } else { showToast(resultado.error, true); }
// NOVA FUNCAO RENDERIZAR MONITOR SLA

};
function renderizarMonitorSLACompleto() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var todosAgendamentos = AppState.getAgendamentos();
    var emAndamento = [];
    var agendados = [];
    
    for (var i = 0; i < todosAgendamentos.length; i++) {
        var ag = todosAgendamentos[i];
        if (isHoje(ag.dataHoraAgendada)) {
            if (ag.status === 'EM_ANDAMENTO') {
                emAndamento.push(ag);
                if (!timersAtivos[ag.id]) {
                    iniciarTimer(ag.id, ag.horaChegadaDoca);
                }
            }
            else if (ag.status === 'AGENDADO') {
                agendados.push(ag);
            }
        }
    }
    
    agendados.sort(function(a, b) {
        return new Date(a.dataHoraAgendada) - new Date(b.dataHoraAgendada);
    });
    
    var html = '<div class="card">' +
        '<div class="card-title">Monitor de SLA - 3 horas</div>' +
        '<div class="stats-row">' +
        '<div class="stat-mini" style="background:#fff3cd;"><div class="stat-mini-value" style="color:#d97706;">' + emAndamento.length + '</div><div>Em Andamento</div><div style="font-size:0.7rem;">na doca hoje</div></div>' +
        '<div class="stat-mini" style="background:#e8f4f5;"><div class="stat-mini-value" style="color:#2c5f8a;">' + agendados.length + '</div><div>Agendados</div><div style="font-size:0.7rem;">para hoje</div></div>' +
        '</div>';
    
    if (emAndamento.length > 0) {
        html += '<h3 style="margin: 24px 0 16px 0; color:#d97706; font-size:1rem; border-left:4px solid #d97706; padding-left:12px;"> EM ANDAMENTO - NA DOCA</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">';
        
        for (var e = 0; e < emAndamento.length; e++) {
            var a = emAndamento[e];
            var chegadaDoca = new Date(a.horaChegadaDoca);
            var agora = new Date();
            var tempoDecorrido = Math.floor((agora - chegadaDoca) / 60000);
            var slaTotal = 180;
            var tempoRestante = Math.max(0, slaTotal - tempoDecorrido);
            var expirado = tempoRestante <= 0;
            var tempoDecorridoText = (tempoDecorrido >= 60) ? Math.floor(tempoDecorrido / 60) + 'h ' + (tempoDecorrido % 60) + 'min' : tempoDecorrido + 'min';
            var tempoRestanteText = (tempoRestante >= 60) ? Math.floor(tempoRestante / 60) + 'h ' + (tempoRestante % 60) + 'min' : tempoRestante + 'min';
            var percProgresso = Math.min(100, Math.floor((tempoDecorrido / slaTotal) * 100));
            
            var etapaAtual = (a.etapa !== undefined && a.etapa >= 0) ? a.etapa : -1;
            if (a.status === 'EM_ANDAMENTO' && etapaAtual < 1) etapaAtual = 1;
            
            html += '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                '<span style="font-weight: 700; font-size: 1rem;">Senha: ' + (a.senha || '-') + '</span>' +
                '<span class="badge" style="background:#2c5f8a; color:white;">Doca ' + a.numeroDoca + '</span>' +
                '</div>' +
                '<div style="margin-bottom: 6px;"><strong>' + a.fornecedor + '</strong></div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 6px;">Veículo: ' + a.veiculo + ' | ' + a.quantidade.toLocaleString() + ' paletes</div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 12px;">Chegada: ' + chegadaDoca.toLocaleTimeString() + '</div>' +
                '<div style="margin-top: 12px;">' + EtapasManager.renderizarTimeline(etapaAtual) + '</div>' +
                '<div style="background: #f0f2f5; border-radius: 12px; height: 8px; margin-bottom: 12px;">' +
                '<div style="background: ' + (expirado ? '#dc2626' : '#d97706') + '; width: ' + percProgresso + '%; height: 8px; border-radius: 12px;"></div>' +
                '</div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<div><span style="font-size:0.7rem; color:#6c8d9b;">Tempo em doca:</span><br><span style="font-weight: 700;">' + tempoDecorridoText + '</span></div>' +
                '<div style="text-align:center;"><span style="font-size:0.7rem; color:#6c8d9b;">Restante SLA:</span><br><span style="font-weight: 700; ' + (expirado ? 'color:#dc2626' : 'color:#2c5f8a') + '">' + (expirado ? 'EXPIRADO!' : tempoRestanteText) + '</span></div>' +
                '<button class="upload-btn" onclick="window.concluirAgendamento(' + a.id + ')" style="padding:6px 14px; background:#2c5f8a;">Concluir</button>' +
                '</div>';
            
            if (a.status !== 'FINALIZADO') {
                html += '<div style="display: flex; gap: 8px; margin-top: 12px;">';
                if (etapaAtual < 3) {
                    html += '<button class="upload-btn" onclick="window.avancarEtapa(' + a.id + ')" style="background:#10b981; padding:6px 12px; font-size:0.7rem;">✓ Avançar Etapa</button>';
                }
                if (etapaAtual > 0) {
                    html += '<button class="upload-btn" onclick="window.voltarEtapa(' + a.id + ')" style="background:#6c8d9b; padding:6px 12px; font-size:0.7rem;">↺ Voltar Etapa</button>';
                }
                html += '</div>';
            }
            
            html += '</div>';
        }
        html += '</div>';
    }
    
    if (agendados.length > 0) {
        html += '<h3 style="margin: 24px 0 16px 0; color:#2c5f8a; font-size:1rem; border-left:4px solid #2c5f8a; padding-left:12px;"> AGENDADOS - AGUARDANDO DOCA</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">';
        
        for (var a2 = 0; a2 < agendados.length; a2++) {
            var a = agendados[a2];
            var horario = new Date(a.dataHoraAgendada);
            var agora = new Date();
            var atrasado = horario < agora;
            
            html += '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                '<span style="font-weight: 700; font-size: 1rem;">Senha: ' + (a.senha || '-') + '</span>' +
                (atrasado ? '<span class="badge" style="background:#dc2626; color:white;">Atrasado</span>' : '<span class="badge" style="background:#2c5f8a; color:white;">Agendado</span>') +
                '</div>' +
                '<div style="margin-bottom: 6px;"><strong>' + a.fornecedor + '</strong></div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 6px;">Veículo: ' + a.veiculo + ' | ' + a.quantidade.toLocaleString() + ' paletes</div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 12px;">Agendado: ' + horario.toLocaleString() + (atrasado ? ' <span style="color:#dc2626;">(ATRASADO)</span>' : '') + '</div>' +
                '</div>';
        }
        html += '</div>';
    }
    
    if (emAndamento.length === 0 && agendados.length === 0) {
        html += '<p style="text-align:center; padding:60px; color:#6c8d9b;">Nenhum agendamento para hoje</p>';
    }
    html += '</div>';
    
    html += '<div id="modalDoca" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">' +
        '<div style="background:white; border-radius:20px; padding:24px; width:400px; max-width:90%;">' +
        '<h3 style="margin-bottom:16px;"> Registrar Chegada na Doca</h3>' +
        '<input type="hidden" id="modalAgendamentoId">' +
        '<div style="margin-bottom:16px;">' +
        '<label style="display:block; margin-bottom:8px; font-weight:500;">Numero da Doca:</label>' +
        '<input type="number" id="modalNumeroDoca" placeholder="Ex: 15" class="upload-btn" style="width:100%; background:#f0f2f5; color:#333; padding:10px;">' +
        '</div>' +
        '<div style="margin-bottom:16px;">' +
        '<label style="display:block; margin-bottom:8px; font-weight:500;">Motorista (opcional):</label>' +
        '<input type="text" id="modalMotorista" placeholder="Nome do motorista" class="upload-btn" style="width:100%; background:#f0f2f5; color:#333; padding:10px;">' +
        '</div>' +
        '<div style="display:flex; gap:12px; justify-content:flex-end;">' +
        '<button class="upload-btn" onclick="window.fecharModalDoca()" style="background:#6c8d9b;">Cancelar</button>' +
        '<button class="upload-btn" onclick="window.confirmarRegistroDoca()" style="background:#2c5f8a;">Confirmar</button>' +
        '</div></div></div>';
    
    container.innerHTML = html;
}

// Função avançar etapa com suporte a doca
window.avancarEtapa = function(id, numeroDoca) {
    var agendamentos = AppState.getAgendamentos();
    var agendamento = null;
    var index = -1;
    
    for (var i = 0; i < agendamentos.length; i++) {
        if (agendamentos[i].id === id) {
            agendamento = agendamentos[i];
            index = i;
            break;
        }
    }
    
    if (!agendamento) {
        showToast('Agendamento não encontrado!', true);
        return;
    }
    
    var etapaAtual = agendamento.etapa !== undefined ? agendamento.etapa : -1;
    var requerDoca = EtapasManager.getEtapaRequerDoca(etapaAtual);
    
    if (requerDoca && (!numeroDoca || numeroDoca === '')) {
        // Mostrar modal para informar a doca
        window.abrirModalDocaAvancar(id);
        return;
    }
    
    var resultado = EtapasManager.avancarEtapa(agendamento, usuarioAtual, numeroDoca);
    
    if (resultado.success) {
        agendamentos[index] = resultado.agendamento;
        AppState.persistirDados();
        showToast('✅ Avançado para: ' + resultado.etapa.nome);
        renderizarMonitorSLACompleto();
        renderizarDashboardPrincipal();
    } else if (resultado.requerDoca) {
        window.abrirModalDocaAvancar(id);
    } else {
        showToast(resultado.error, true);
    }
};

// Modal para informar doca ao avançar
window.abrirModalDocaAvancar = function(id) {
    var modal = document.getElementById('modalDocaAvancar');
    if (!modal) {
        // Criar modal se não existir
        var div = document.createElement('div');
        div.id = 'modalDocaAvancar';
        div.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1001; align-items:center; justify-content:center;';
        div.innerHTML = '<div style="background:white; border-radius:20px; padding:24px; width:400px; max-width:90%;">' +
            '<h3 style="margin-bottom:16px;">🚛 Informar Número da Doca</h3>' +
            '<input type="hidden" id="modalDocaAvancarId">' +
            '<div style="margin-bottom:16px;">' +
            '<label style="display:block; margin-bottom:8px; font-weight:500;">Número da Doca:</label>' +
            '<input type="number" id="modalDocaAvancarNumero" placeholder="Ex: 15" class="upload-btn" style="width:100%; background:#f0f2f5; color:#333; padding:10px;">' +
            '</div>' +
            '<div style="display:flex; gap:12px; justify-content:flex-end;">' +
            '<button class="upload-btn" onclick="window.fecharModalDocaAvancar()" style="background:#6c8d9b;">Cancelar</button>' +
            '<button class="upload-btn" onclick="window.confirmarDocaAvancar()" style="background:#2c5f8a;">Confirmar</button>' +
            '</div></div>';
        document.body.appendChild(div);
        modal = div;
    }
    
    document.getElementById('modalDocaAvancarId').value = id;
    document.getElementById('modalDocaAvancarNumero').value = '';
    modal.style.display = 'flex';
};

window.fecharModalDocaAvancar = function() {
    var modal = document.getElementById('modalDocaAvancar');
    if (modal) modal.style.display = 'none';
};

window.confirmarDocaAvancar = function() {
    var id = document.getElementById('modalDocaAvancarId').value;
    var numeroDoca = document.getElementById('modalDocaAvancarNumero').value;
    
    if (!numeroDoca) {
        showToast('Informe o número da doca!', true);
        return;
    }
    
    window.fecharModalDocaAvancar();
    window.avancarEtapa(parseInt(id), parseInt(numeroDoca));
};
