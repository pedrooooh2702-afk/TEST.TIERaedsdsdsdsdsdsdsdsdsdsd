
const STAFF_PASSWORD = "TEST.TIER.PLAYER";

const MODES = [
    "CRYSTAL",
    "SWORD",
    "SMP",
    "MACE",
    "NETHERITE POT",
    "AXE"
    "SPEAR MACE",
];

const REGIONS = [
    "Brasil",
    "Estados Unidos",
    "México",
    "Uruguai",
    "Equador",
    "Venezuela",
    "Colômbia",
    "Chile",
    "Argentina",
    "Espanha"
];

// CÓDIGOS DAS BANDEIRAS
const REGION_FLAGS = {
    "Brasil": "br",
    "Estados Unidos": "us",
    "México": "mx",
    "Uruguai": "uy",
    "Equador": "ec",
    "Venezuela": "ve",
    "Colômbia": "co",
    "Chile": "cl",
    "Argentina": "ar",
    "Espanha": "es"
};

let players = loadData("testTierPlayers", []);
let season = localStorage.getItem("testTierSeason") || "S1";
let currentMode = "GERAL";
let staffAuthenticated = false;
let editingId = null;

function loadData(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(fallback) && Array.isArray(data)
            ? data
            : data ?? fallback;
    } catch {
        return fallback;
    }
}

function saveData() {
    localStorage.setItem("testTierPlayers", JSON.stringify(players));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function avatarURL(name) {
    return `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`;
}

// ENDEREÇO DA BANDEIRA CONFORME A REGIÃO
function flagURL(region) {
    const code = REGION_FLAGS[region];

    if (!code) {
        return "";
    }

    return `https://flagcdn.com/w40/${code}.png`;
}

// MODAIS

function openStaff() {
    document.getElementById("loginModal").style.display =
        staffAuthenticated ? "none" : "flex";

    if (staffAuthenticated) {
        document.getElementById("staffModal").style.display = "flex";
    }
}

function closeModals() {
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("staffModal").style.display = "none";
}

function checkPassword() {
    const password = document.getElementById("staffPassword").value;

    if (password !== STAFF_PASSWORD) {
        document.getElementById("loginError").textContent =
            "Senha incorreta!";
        return;
    }

    staffAuthenticated = true;
    document.getElementById("staffPassword").value = "";
    document.getElementById("loginError").textContent = "";

    document.getElementById("loginModal").style.display = "none";
    document.getElementById("staffModal").style.display = "flex";

    renderPlayers();
}

function logoutStaff() {
    staffAuthenticated = false;
    editingId = null;
    resetForm();
    closeModals();
    renderPlayers();
}

// ABAS DO PAINEL

function showAdminTab(tabId, button) {
    document.getElementById("playerForm").classList.add("hidden");
    document.getElementById("seasonForm").classList.add("hidden");

    document.getElementById(tabId).classList.remove("hidden");

    document.querySelectorAll(".admin-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    button.classList.add("active");
}

// PRÉVIA DA SKIN

document.getElementById("playerName").addEventListener("input", event => {
    const name = event.target.value.trim();
    const preview = document.getElementById("skinPreview");

    document.getElementById("skinName").textContent =
        name || "Prévia da skin";

    preview.src = name ? avatarURL(name) : "";
    preview.style.display = name ? "block" : "none";
});

document.getElementById("skinPreview").addEventListener("error", event => {
    event.target.style.display = "none";
});

// CADASTRO E EDIÇÃO

function savePlayer(event) {
    event.preventDefault();

    if (!staffAuthenticated) {
        alert("Apenas a staff pode realizar essa ação.");
        return;
    }

    const name = document.getElementById("playerName").value.trim();
    const mode = document.getElementById("playerMode").value;
    const tier = document.getElementById("playerTier").value;
    const points = Number(document.getElementById("playerPoints").value);
    const region = document.getElementById("playerRegion").value;
    const tests = Number(document.getElementById("playerTests").value);

    const error = document.getElementById("formError");
    error.textContent = "";

    if (!/^[a-zA-Z0-9_]{1,16}$/.test(name)) {
        error.textContent = "Digite um nick Minecraft válido.";
        return;
    }

    if (!MODES.includes(mode) || !REGIONS.includes(region)) {
        error.textContent = "Modalidade ou região inválida.";
        return;
    }

    if (!Number.isSafeInteger(points) || points < 0 ||
        !Number.isSafeInteger(tests) || tests < 0) {
        error.textContent = "Pontos e testes devem ser números válidos.";
        return;
    }

    const duplicate = players.some(player =>
        player.name.toLowerCase() === name.toLowerCase() &&
        player.mode === mode &&
        player.id !== editingId
    );

    if (duplicate) {
        error.textContent =
            "Esse jogador já está cadastrado nesta modalidade.";
        return;
    }

    if (editingId) {
        const player = players.find(p => p.id === editingId);

        if (!player) {
            error.textContent = "Jogador não encontrado.";
            return;
        }

        Object.assign(player, {
            name,
            mode,
            tier,
            points,
            region,
            tests
        });

    } else {
        players.push({
            id: crypto.randomUUID(),
            name,
            mode,
            tier,
            points,
            region,
            tests
        });
    }

    const wasEditing = Boolean(editingId);

    saveData();
    resetForm();
    renderPlayers();

    alert(wasEditing ? "Jogador atualizado!" : "Jogador cadastrado!");

    editingId = null;

    document.getElementById("formTitle").textContent =
        "ADICIONAR JOGADOR";

    document.getElementById("saveButton").textContent =
        "CADASTRAR JOGADOR";
}

function editPlayer(id) {
    if (!staffAuthenticated) return;

    const player = players.find(p => p.id === id);
    if (!player) return;

    editingId = id;

    document.getElementById("playerName").value = player.name;
    document.getElementById("playerMode").value = player.mode;
    document.getElementById("playerTier").value = player.tier;
    document.getElementById("playerPoints").value = player.points;
    document.getElementById("playerRegion").value = player.region;
    document.getElementById("playerTests").value = player.tests;

    document.getElementById("skinPreview").src = avatarURL(player.name);
    document.getElementById("skinPreview").style.display = "block";
    document.getElementById("skinName").textContent = player.name;

    document.getElementById("formTitle").textContent =
        "EDITAR JOGADOR";

    document.getElementById("saveButton").textContent =
        "SALVAR ALTERAÇÕES";

    document.getElementById("formError").textContent = "";

    showAdminTab(
        "playerForm",
        document.querySelector(".admin-tab")
    );

    document.getElementById("staffModal").scrollTop = 0;
}

function resetForm() {
    document.getElementById("playerForm").reset();
    document.getElementById("playerPoints").value = "0";
    document.getElementById("playerTests").value = "1";

    document.getElementById("skinPreview").src = "";
    document.getElementById("skinPreview").style.display = "none";
    document.getElementById("skinName").textContent = "Prévia da skin";
    document.getElementById("formError").textContent = "";
}

function cancelEdit() {
    editingId = null;
    resetForm();

    document.getElementById("formTitle").textContent =
        "ADICIONAR JOGADOR";

    document.getElementById("saveButton").textContent =
        "CADASTRAR JOGADOR";
}

// REMOVER JOGADOR

function deletePlayer(id) {
    if (!staffAuthenticated) return;

    const player = players.find(p => p.id === id);
    if (!player) return;

    if (!confirm(`Deseja remover ${player.name} do ranking?`)) {
        return;
    }

    players = players.filter(p => p.id !== id);

    if (editingId === id) {
        editingId = null;
        resetForm();
    }

    saveData();
    renderPlayers();
}

// TEMPORADA

function saveSeason(event) {
    event.preventDefault();

    if (!staffAuthenticated) return;

    const newSeason =
        document.getElementById("seasonName").value.trim();

    if (!newSeason || newSeason.length > 20) return;

    season = newSeason;
    localStorage.setItem("testTierSeason", season);

    renderStats();

    alert("Temporada atualizada!");
}

// MODALIDADES

document.querySelectorAll(".mode").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".mode").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        currentMode = button.dataset.mode;

        renderPlayers();
    });
});

// FILTROS

document.getElementById("searchInput")
    .addEventListener("input", renderPlayers);

document.getElementById("regionFilter")
    .addEventListener("change", renderPlayers);

// CONTADORES

function renderStats() {
    document.getElementById("totalPlayers").textContent =
        players.length;

    const totalTests = players.reduce(
        (total, player) => total + (Number(player.tests) || 0),
        0
    );

    document.getElementById("totalTests").textContent = totalTests;

    document.getElementById("seasonDisplay").textContent = season;
    document.getElementById("seasonName").value = season;
}

// RANKING

function renderPlayers() {
    renderStats();

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const region = document.getElementById("regionFilter").value;

    const filtered = players
        .filter(player =>
            currentMode === "GERAL" || player.mode === currentMode
        )
        .filter(player =>
            player.name.toLowerCase().includes(search)
        )
        .filter(player =>
            !region || player.region === region
        )
        .sort((a, b) => b.points - a.points);

    const list = document.getElementById("playersList");

    document.getElementById("resultCount").textContent =
        `${filtered.length} jogador(es)`;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty">
                Nenhum jogador encontrado nesta modalidade.
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map((player, index) => {
        const actions = staffAuthenticated
            ? `<div class="actions">
                <button class="edit-btn"
                    onclick="editPlayer('${player.id}')">EDITAR</button>
                <button class="delete-btn"
                    onclick="deletePlayer('${player.id}')">EXCLUIR</button>
               </div>`
            : "—";

        const flag = flagURL(player.region);

        return `
            <div class="player-row">
                <span class="position">#${index + 1}</span>

                <div class="player-info">
                    <img
                        src="${avatarURL(player.name)}"
                        alt="Skin de ${escapeHTML(player.name)}"
                        loading="lazy"
                    >

                    ${flag ? `
                        <img
                            class="country-flag"
                            src="${flag}"
                            alt="Bandeira de ${escapeHTML(player.region)}"
                            title="${escapeHTML(player.region)}"
                            loading="lazy"
                        >
                    ` : ""}

                    <div>
                        <div class="player-name">
                            ${escapeHTML(player.name)}
                        </div>
                        <small style="color:#777">
                            ${escapeHTML(player.mode)}
                        </small>
                    </div>
                </div>

                <span class="tier">${escapeHTML(player.tier)}</span>

                <span class="points">
                    ${Number(player.points).toLocaleString("pt-BR")} pts
                </span>

                <span class="region">
                    ${escapeHTML(player.region)}
                </span>

                <span class="staff-column">${actions}</span>
            </div>
        `;
    }).join("");
}

// INICIALIZAÇÃO

renderPlayers();
