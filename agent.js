import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const BASE_URL = "http://localhost:8000"; // ou sua URL de deploy

// ====================== DOM ======================
const authSection  = document.getElementById("authSection");
const agentSection = document.getElementById("agentSection");
const chatBox      = document.getElementById("chatBox");
const msgInput     = document.getElementById("msgInput");
const btnEnviar    = document.getElementById("btnEnviar");
const btnLogout    = document.getElementById("btnLogout");
const welcome      = document.getElementById("welcome");
const userBadge    = document.getElementById("userBadge");
const hoperImg     = document.getElementById("hoperImg");

const btnSintoma   = document.getElementById("btnSintoma");
const btnDica      = document.getElementById("btnDica");
const btnPostos    = document.getElementById("btnPostos");

// Inputs login
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");
const btnLogin   = document.getElementById("btnLogin");

// Inputs registro
const regNome    = document.getElementById("regNome");
const regIdade   = document.getElementById("regIdade");
const regEmail   = document.getElementById("regEmail");
const regCep     = document.getElementById("regCep");
const regSenha   = document.getElementById("regSenha");
const btnRegister = document.getElementById("btnRegister");

// ====================== FUNÇÕES AUXILIARES ======================
function avatarPorIdade(idade) {
  if (!idade) idade = 30;
  if (idade <= 17) return "hoper_jovem.gif"; // grupo 1: 0 a 17
  return "hoper_adulto.gif";                 // grupo 2: 18 a 100
}
function atualizarHoperPorHumor(texto, idade) {
  if (!hoperImg) return;
  const t = (texto || "").toLowerCase();

if (t.match(/obrigado|ótimo|feliz|melhora|alívio|melhorei|top|boa|legal|perfeito|show|sucesso|uhul|maravilha/i)) {
  hoperImg.src = (idade <= 17) ? "hoper_jovem_feliz.gif" : "hoper_adulto_feliz.gif";
} else if (t.match(/dor|problema|sintoma|alerta|urgente|triste|cansado|cansada|chateado|depressivo|mal|doente|preocupado/i)) {
  hoperImg.src = (idade <= 17) ? "hoper_jovem_preocupado.gif" : "hoper_adulto_preocupado.gif";
} else {
  hoperImg.src = (idade <= 17) ? "hoper_jovem_neutro.gif" : "hoper_adulto_neutro.gif";
}

function setHeader(user) {
  const primeiroNome = (user.nome || user.email).split(" ")[0];
  welcome.textContent = `Bem-vindo(a), ${primeiroNome}`;
  userBadge.textContent = `${user.cep || ""} • ${user.idade || ""} anos`;
  if (hoperImg) hoperImg.src = avatarPorIdade(user.idade);
}

function addMsg(who, text) {
  const row = document.createElement("div");
  row.className = `msg ${who === "Você" ? "user" : "bot"}`;
  row.innerHTML = `<div class="who">${who}</div><div class="bubble">${text.replace(/\n/g, "<br>")}</div>`;
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Mostrar/ocultar telas
function showAuth() { authSection.classList.remove("hidden"); agentSection.classList.add("hidden"); }
function showAgent() { authSection.classList.add("hidden"); agentSection.classList.remove("hidden"); chatBox.scrollTop = chatBox.scrollHeight; }

// ====================== ABAS LOGIN/REGISTRO ======================
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".form-box").forEach(f => f.classList.add("hidden"));
    document.getElementById(btn.dataset.target).classList.remove("hidden");
  });
});

// ====================== VALIDAÇÕES ======================
function validarNome(nome) { return /^[A-Za-zÀ-ú\s]+$/.test(nome.trim()); }
function validarIdade(idade) { return !isNaN(idade) && idade > 0 && idade < 150; }
function validarCEP(cep) { return /^\d{8}$/.test(cep); }

// ====================== POSTOS ======================
async function mostrarPostos(user_id) {
  try {
    const res = await fetch(`${BASE_URL}/posto_proximo/${user_id}`);
    const data = await res.json();
    const postos = data.postos_proximos || [];
    if (postos.length > 0) {
      const top5 = postos.slice(0, 5);
      const linhas = top5.map(p => `• ${p.nome} — ${p.endereco || "Endereço não informado"}`).join("\n");
      addMsg("Hoper", `🏥 Postos de Saúde próximos:\n${linhas}`);
    } else addMsg("Hoper", "Nenhum posto próximo encontrado.");
  } catch (e) {
    console.warn("Erro ao buscar postos:", e);
    addMsg("Hoper", "Não consegui buscar os postos próximos.");
  }
}

btnPostos.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Faça login primeiro."); return; }
  addMsg("Você", "🏥 Procurar postos próximos…");
  await mostrarPostos(user.uid);
});

// ====================== REGISTRO ======================
btnRegister.addEventListener("click", async () => {
  const nome = regNome.value.trim();
  const email = regEmail.value.trim();
  const idade = parseInt(regIdade.value, 10);
  const cep = regCep.value.replace(/\D/g,'');
  const senha = regSenha.value.trim();

  if (!nome || !email || !cep || !idade || !senha) { alert("Preencha todos os campos."); return; }
  if (!validarNome(nome)) { alert("Nome inválido."); return; }
  if (!validarIdade(idade)) { alert("Idade inválida."); return; }
  if (!validarCEP(cep)) { alert("CEP inválido."); return; }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), { nome, idade, cep, email });

    await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, idade, cep, uid: user.uid })
    });

    setHeader({ nome, email, cep, idade });
    chatBox.innerHTML = "";
    addMsg("Hoper", `Olá, ${nome.split(" ")[0]}! Estou aqui para ajudar. 👩‍⚕️`);
    showAgent();
  } catch(e) { alert(e.message || "Erro ao registrar"); }
});

// ====================== LOGIN ======================
btnLogin.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const senha = loginSenha.value.trim();
  if (!email || !senha) { alert("Informe email e senha."); return; }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (!docSnap.exists()) throw new Error("Usuário não encontrado");
    const userData = docSnap.data();

    setHeader(userData);
    chatBox.innerHTML = "";
    addMsg("Hoper", `Bem-vindo de volta, ${userData.nome.split(" ")[0]}! Como posso ajudar hoje?`);
    showAgent();
  } catch(e) { alert(e.message || "Erro ao logar"); }
});

// ====================== LOGOUT ======================
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  showAuth();
  chatBox.innerHTML = "";
});

// ====================== ENVIO DE MENSAGENS ======================
async function enviar(texto){
  const user = auth.currentUser;
  if(!user){ alert("Faça login primeiro."); showAuth(); return; }

  const docSnap = await getDoc(doc(db, "users", user.uid));
  const userData = docSnap.exists() ? docSnap.data() : { email:user.email };

  addMsg("Você", texto);

  const digitando = document.createElement("div");
  digitando.className = "msg bot";
  digitando.innerHTML = `<div class="who">Hoper</div><div class="bubble">digitando…</div>`;
  chatBox.appendChild(digitando);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ user_id:user.uid, texto })
    });
    const data = await res.json();
    chatBox.removeChild(digitando);

    addMsg("Hoper", data.resposta || "Não consegui responder.");
    atualizarHoperPorHumor(data.resposta, userData.idade);

    if(data.postos && data.postos.length > 0){
      const linhas = data.postos.map(p => `• ${p.nome} — ${p.endereco || "Endereço não informado"}`).join("\n");
      addMsg("Hoper", `Unidades próximas:\n${linhas}`);
    }

  } catch(e){
    chatBox.removeChild(digitando);
    addMsg("Hoper", "Erro ao conectar ao servidor.");
  }
}

// Centralizar envio (botão + Enter)
function enviarMsgInput() {
  const t = msgInput.value.trim();
  if(!t) return;
  msgInput.value = "";
  enviar(t);
}
btnEnviar.addEventListener("click", enviarMsgInput);
msgInput.addEventListener("keydown", e => { if(e.key==="Enter"){ e.preventDefault(); enviarMsgInput(); }});

// ====================== BOTÕES DE ATALHO ======================
const atalhos = [
  { btn: btnSintoma, msg: "Me dê um sintoma comum para análise." },
  { btn: btnDica, msg: "Me dê uma dica de prevenção contra doenças comuns." }
];

atalhos.forEach(a => a.btn.addEventListener("click", () => enviar(a.msg)));

// ====================== BOOT / SESSÃO ======================
auth.onAuthStateChanged(async (user)=>{
  if(user){
    const docSnap = await getDoc(doc(db, "users", user.uid));
    const userData = docSnap.exists() ? docSnap.data() : { email:user.email };
    setHeader(userData);
    chatBox.innerHTML = "";
    addMsg("Hoper", `Olá, ${userData.nome?.split(" ")[0] || user.email}! Retomando nosso atendimento.`);
    atualizarHoperPorHumor("", userData.idade);
    showAgent();
  }
});
