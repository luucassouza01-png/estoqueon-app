// ==================== MÓDULO: AUTENTICAÇÃO E USUÁRIOS ====================
const Auth = (function() {
    
    const STORAGE_KEY = 'estoqueon_usuarios';
    const SESSION_KEY = 'estoqueon_usuario_logado';
    
    // Usuário padrão Admin
    const usuarioAdmin = {
        matricula: 'admin',
        senha: 'admin123',
        nome: 'Administrador',
        tipo: 'admin',
        modulos: ['dashboard', 'agendamentos', 'saldo', 'monitor', 'historico', 'reset', 'admin']
    };
    
    // Carregar usuários do localStorage
    function carregarUsuarios() {
        var usuarios = localStorage.getItem(STORAGE_KEY);
        if (usuarios) {
            try {
                return JSON.parse(usuarios);
            } catch(e) {
                console.error('Erro ao carregar usuários:', e);
                return [usuarioAdmin];
            }
        }
        return [usuarioAdmin];
    }
    
    // Salvar usuários
    function salvarUsuarios(usuarios) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
    }
    
    // Verificar login
    function login(matricula, senha) {
        var usuarios = carregarUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula === matricula && usuarios[i].senha === senha) {
                var usuarioLogado = {
                    matricula: usuarios[i].matricula,
                    nome: usuarios[i].nome,
                    tipo: usuarios[i].tipo,
                    modulos: usuarios[i].modulos || []
                };
                localStorage.setItem(SESSION_KEY, JSON.stringify(usuarioLogado));
                return usuarioLogado;
            }
        }
        return null;
    }
    
    // Verificar se está logado
    function isLogado() {
        var session = localStorage.getItem(SESSION_KEY);
        return session !== null;
    }
    
    // Obter usuário logado
    function getUsuarioLogado() {
        var session = localStorage.getItem(SESSION_KEY);
        if (session) {
            try {
                return JSON.parse(session);
            } catch(e) {
                return null;
            }
        }
        return null;
    }
    
    // Logout
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.reload();
    }
    
    // Verificar se usuário tem acesso a um módulo
    function temAcesso(modulo) {
        var usuario = getUsuarioLogado();
        if (!usuario) return false;
        if (usuario.tipo === 'admin') return true;
        return usuario.modulos && usuario.modulos.indexOf(modulo) !== -1;
    }
    
    // Obter módulos visíveis para o usuário
    function getModulosVisiveis() {
        var usuario = getUsuarioLogado();
        if (!usuario) return [];
        if (usuario.tipo === 'admin') {
            return ['dashboard', 'agendamentos', 'saldo', 'monitor', 'historico', 'reset', 'admin'];
        }
        return usuario.modulos || [];
    }
    
    // Listar todos os usuários (apenas admin)
    function listarUsuarios() {
        var usuario = getUsuarioLogado();
        if (!usuario || usuario.tipo !== 'admin') return [];
        return carregarUsuarios();
    }
    
    // Adicionar novo usuário (apenas admin)
    function adicionarUsuario(matricula, senha, nome, modulos) {
        var usuario = getUsuarioLogado();
        if (!usuario || usuario.tipo !== 'admin') return false;
        
        var usuarios = carregarUsuarios();
        
        // Verificar se matrícula já existe
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula === matricula) {
                return false;
            }
        }
        
        usuarios.push({
            matricula: matricula,
            senha: senha,
            nome: nome,
            tipo: 'operador',
            modulos: modulos || []
        });
        
        salvarUsuarios(usuarios);
        return true;
    }
    
    // Atualizar usuário
    function atualizarUsuario(matricula, dados) {
        var usuario = getUsuarioLogado();
        if (!usuario || usuario.tipo !== 'admin') return false;
        
        var usuarios = carregarUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula === matricula) {
                usuarios[i] = { ...usuarios[i], ...dados };
                salvarUsuarios(usuarios);
                return true;
            }
        }
        return false;
    }
    
    // Remover usuário
    function removerUsuario(matricula) {
        var usuario = getUsuarioLogado();
        if (!usuario || usuario.tipo !== 'admin') return false;
        if (matricula === 'admin') return false; // Não pode remover admin
        
        var usuarios = carregarUsuarios();
        var novosUsuarios = [];
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula !== matricula) {
                novosUsuarios.push(usuarios[i]);
            }
        }
        salvarUsuarios(novosUsuarios);
        return true;
    }

        // Editar usuário
    function editarUsuario(matriculaOriginal, novosDados) {
        var usuario = getUsuarioLogado();
        if (!usuario || usuario.tipo !== 'admin') return false;
        if (matriculaOriginal === 'admin') return false; // Não pode editar admin
        
        var usuarios = carregarUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula === matriculaOriginal) {
                usuarios[i] = {
                    ...usuarios[i],
                    nome: novosDados.nome || usuarios[i].nome,
                    senha: novosDados.senha || usuarios[i].senha,
                    modulos: novosDados.modulos || usuarios[i].modulos
                };
                // Se a matrícula foi alterada, atualizar
                if (novosDados.matricula && novosDados.matricula !== matriculaOriginal) {
                    // Verificar se nova matrícula já existe
                    var existe = false;
                    for (var j = 0; j < usuarios.length; j++) {
                        if (usuarios[j].matricula === novosDados.matricula && j !== i) {
                            existe = true;
                            break;
                        }
                    }
                    if (existe) return false;
                    usuarios[i].matricula = novosDados.matricula;
                }
                salvarUsuarios(usuarios);
                return true;
            }
        }
        return false;
    }
    
    // Buscar usuário por matrícula
    function buscarUsuario(matricula) {
        var usuarios = carregarUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].matricula === matricula) {
                return { ...usuarios[i] };
            }
        }
        return null;
    }
    
    // Todos os módulos disponíveis
    function getModulosDisponiveis() {
        return [
            { id: 'dashboard', nome: 'Dashboard', icone: 'fa-tachometer-alt' },
            { id: 'agendamentos', nome: 'Agendamentos', icone: 'fa-calendar-alt' },
            { id: 'saldo', nome: 'Saldo Paletes', icone: 'fa-boxes' },
            { id: 'monitor', nome: 'Monitor SLA', icone: 'fa-clock' },
            { id: 'historico', nome: 'Histórico', icone: 'fa-history' }
        ];
    }
    
        return {
        login: login,
        logout: logout,
        isLogado: isLogado,
        getUsuarioLogado: getUsuarioLogado,
        temAcesso: temAcesso,
        getModulosVisiveis: getModulosVisiveis,
        listarUsuarios: listarUsuarios,
        adicionarUsuario: adicionarUsuario,
        editarUsuario: editarUsuario,
        buscarUsuario: buscarUsuario,
        removerUsuario: removerUsuario,
        getModulosDisponiveis: getModulosDisponiveis
    };
})();