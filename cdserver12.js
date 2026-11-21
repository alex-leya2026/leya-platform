const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use((req, res, next) => (/\.json$|^\/data|cdserver12/i.test(req.path) ? res.status(404).send('Not found') : next()));
app.use(express.static('.'));

const FOLDER_DATE = fs.existsSync('/app/data') ? '/app/data' : '.';
const FISIER_UTILIZATORI = FOLDER_DATE + '/utilizatori-leya.json';
const FISIER_OFERTE = FOLDER_DATE + '/oferte-leya.json';
const FISIER_TARIFE = FOLDER_DATE + '/tarife-leya.json';
const SABLON_DOMENII = {
    'PVC': [
        { id: 1, denumire: 'Fereastră PVC 6 camere + Tripan', um: 'mp', pretUnitar: 145 },
        { id: 2, denumire: 'Ușă balcon PVC + Feronerie Roto', um: 'mp', pretUnitar: 165 },
        { id: 3, denumire: 'Montaj și etanșare profesională', um: 'ml', pretUnitar: 12 }
    ],
    'TABLA': [
        { id: 1, denumire: 'Țiglă metalică 0.5mm Mat (material)', um: 'mp', pretUnitar: 14 },
        { id: 2, denumire: 'Manoperă montaj acoperiș tablă', um: 'mp', pretUnitar: 18 },
        { id: 3, denumire: 'Sistem pluvial (jgheaburi + burlane)', um: 'ml', pretUnitar: 22 }
    ],
    'GARDURI': [
        { id: 1, denumire: 'Panou gard bordurat zincat + stâlpi', um: 'ml', pretUnitar: 38 },
        { id: 2, denumire: 'Gard șipcă metalică dublă (material + montaj)', um: 'ml', pretUnitar: 75 },
        { id: 3, denumire: 'Fundație beton soclu gard', um: 'ml', pretUnitar: 45 }
    ],
    'CONSTRUCTII': [
        { id: 1, denumire: 'Zidărie cărămidă / BCA (manoperă)', um: 'mc', pretUnitar: 65 },
        { id: 2, denumire: 'Termosistem polistiren 10cm + decorativă', um: 'mp', pretUnitar: 36 },
        { id: 3, denumire: 'Șapă mecanizată elicopterizată', um: 'mp', pretUnitar: 14 }
    ],
    'CURATENIE': [
        { id: 1, denumire: 'Curățenie generală după constructor', um: 'mp', pretUnitar: 4.5 },
        { id: 2, denumire: 'Curățenie întreținere birouri / spații', um: 'mp', pretUnitar: 2.2 },
        { id: 3, denumire: 'Spălare geamuri și fațade vitrate', um: 'mp', pretUnitar: 3.0 }
    ]
};

// Funcție care calculează data peste X zile în format YYYY-MM-DD
function dataPesteZile(zile) {
    const d = new Date();
    d.setDate(d.getDate() + zile);
    return d.toISOString().split('T')[0];
}

// Calculează exact câte zile au mai rămas până la expirare
function calculeazaZileRamase(dataExpirare) {
    if (!dataExpirare) return 30;
    const azi = new Date();
    azi.setHours(0, 0, 0, 0);
    const exp = new Date(dataExpirare);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - azi) / (1000 * 60 * 60 * 24));
}

function incarcaUtilizatori() {
    let lista = [];
    if (fs.existsSync(FISIER_UTILIZATORI)) {
        try { lista = JSON.parse(fs.readFileSync(FISIER_UTILIZATORI, 'utf8')); } catch (e) {}
    }
    const conturiBaza = [
        { email: 'admin@leya.ro', parola: 'LeyaAdmin#2026!Secure', nume: 'LEYA Master Admin', telefon: '-', rol: 'ADMIN', domeniu: 'PVC', firmaEmail: 'admin@leya.ro' },
        { email: 'pvc@leya.ro', parola: 'LeyaAdmin#0000!Secure', nume: 'ThermoPVC Construct SRL', telefon: '0721 100 200', rol: 'FIRMA', domeniu: 'PVC', firmaEmail: 'pvc@leya.ro', plan: 'Pro (99€/lună)', dataExpirare: dataPesteZile(25) },
        { email: 'tabla@leya.ro', parola: 'LeyaAdmin#0001!Secure', nume: 'Acoperișuri & Tablă Pro', telefon: '0722 200 300', rol: 'FIRMA', domeniu: 'TABLA', firmaEmail: 'tabla@leya.ro', plan: 'Standard (59€/lună)', dataExpirare: dataPesteZile(2) },
        { email: 'garduri@leya.ro', parola: 'LeyaAdmin#0002!Secure', nume: 'Garduri Metalice Rapid', telefon: '0723 300 400', rol: 'FIRMA', domeniu: 'GARDURI', firmaEmail: 'garduri@leya.ro', plan: 'Basic (29€/lună)', dataExpirare: dataPesteZile(18) },
        { email: 'constructii@leya.ro', parola: 'LeyaAdmin#0003!Secure', nume: 'BuildMaster Construcții', telefon: '0724 400 500', rol: 'FIRMA', domeniu: 'CONSTRUCTII', firmaEmail: 'constructii@leya.ro', plan: 'Pro (99€/lună)', dataExpirare: dataPesteZile(30) },
        { email: 'curatenie@leya.ro', parola: 'LeyaAdmin#0004!Secure', nume: 'CleanExpress Curățenie', telefon: '0725 500 600', rol: 'FIRMA', domeniu: 'CURATENIE', firmaEmail: 'curatenie@leya.ro', plan: 'Standard (59€/lună)', dataExpirare: dataPesteZile(3) },
        { email: 'client@yahoo.com', parola: 'LeyaAdmin#0005!Secure', nume: 'Andrei Popescu', telefon: '0722 123 456', rol: 'CLIENT', firmaEmail: 'admin@leya.ro' }
    ];

    let modificat = false;
    conturiBaza.forEach(cb => {
        const existent = lista.find(u => u.email.toLowerCase() === cb.email);
        if (!existent) {
            lista.push(cb);
            modificat = true;
        } else if (existent.rol === 'FIRMA' && !existent.dataExpirare) {
            existent.plan = cb.plan;
            existent.dataExpirare = cb.dataExpirare;
            modificat = true;
        }
    });
    if (modificat || !fs.existsSync(FISIER_UTILIZATORI)) {
        fs.writeFileSync(FISIER_UTILIZATORI, JSON.stringify(lista, null, 2));
    }
    return lista;
}

function incarcaTarife() {
    let tarife = {};
    if (fs.existsSync(FISIER_TARIFE)) {
        try { tarife = JSON.parse(fs.readFileSync(FISIER_TARIFE, 'utf8')); } catch (e) {}
    }
    let modificat = false;
    Object.keys(SABLON_DOMENII).forEach(dom => {
        const key = dom.toLowerCase() + '@leya.ro';
        if (!tarife[key]) { tarife[key] = SABLON_DOMENII[dom]; modificat = true; }
    });
    if (!tarife['admin@leya.ro']) { tarife['admin@leya.ro'] = SABLON_DOMENII['PVC']; modificat = true; }
    if (modificat || !fs.existsSync(FISIER_TARIFE)) {
        fs.writeFileSync(FISIER_TARIFE, JSON.stringify(tarife, null, 2));
    }
    return tarife;
}

function incarcaOferte() {
    if (fs.existsSync(FISIER_OFERTE)) {
        try { return JSON.parse(fs.readFileSync(FISIER_OFERTE, 'utf8')); } catch (e) {}
    }
    const oferteInitiale = [
        {
            id: 101,
            firmaEmail: 'admin@leya.ro',
            clientEmail: 'client@yahoo.com',
            clientNume: 'Andrei Popescu',
            produs: 'Fereastră PVC 6 camere + Tripan (4.5 mp × 145 €)',
            pret: '652.50 €',
            status: 'In asteptare',
            data: '21.11.2026'
        }
    ];
    fs.writeFileSync(FISIER_OFERTE, JSON.stringify(oferteInitiale, null, 2));
    return oferteInitiale;
}

app.get('/', (req, res) => {
    app.get('/', (req, res) => {
  res.sendFile(__dirname + '/LEYAindex12.html');
});
});

// 1. LOGARE CU VERIFICARE ABONAMENT LUNAR
app.post('/api/auth/login', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const parola = (req.body.parola || '').trim();
    const utilizatori = incarcaUtilizatori();
    const gasit = utilizatori.find(u => u.email.toLowerCase() === email && u.parola === parola);

    if (!gasit) {
        return res.status(401).json({ succes: false, mesaj: "User sau parola gresita!" });
    }

    let zileRamase = 30;
    if (gasit.rol === 'FIRMA') {
        zileRamase = calculeazaZileRamase(gasit.dataExpirare);
        if (zileRamase < 0) {
            return res.status(403).json({
                succes: false,
                mesaj: " Abonamentul lunar (" + (gasit.plan || 'Standard') + ") a expirat pe " + gasit.dataExpirare + "! Contacteaza administratorul LEYA pentru prelungire."
            });
        }
    }

    return res.json({
        succes: true,
        rol: gasit.rol,
        nume: gasit.nume,
        email: gasit.email,
        domeniu: gasit.domeniu || 'GENERAL',
        plan: gasit.plan || 'Nelimitat',
        dataExpirare: gasit.dataExpirare || '-',
        zileRamase: zileRamase
    });
});

// 2. TARIFE FIRME
app.get('/api/firma/tarife', (req, res) => {
    const firmaEmail = (req.query.firmaEmail || '').toLowerCase();
    const tarife = incarcaTarife();
    res.json(tarife[firmaEmail] || []);
});

app.post('/api/firma/tarife', (req, res) => {
    const firmaEmail = (req.body.firmaEmail || '').toLowerCase();
    const listaNoua = req.body.tarife || [];
    const tarife = incarcaTarife();
    tarife[firmaEmail] = listaNoua;
    fs.writeFileSync(FISIER_TARIFE, JSON.stringify(tarife, null, 2));
    res.json({ succes: true, mesaj: "Tarifele tale au fost salvate cu succes!" });
});

// 3. CREARE FIRMĂ CU ABONAMENT LUNAR
app.post('/api/admin/creare-firma', (req, res) => {
    const nume = (req.body.nume || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const parola = (req.body.parola || '').trim();
    const domeniu = (req.body.domeniu || 'CONSTRUCTII').toUpperCase();
    const plan = req.body.plan || 'Standard (59€/lună)';
    const zile = parseInt(req.body.zile) || 30;

    if (!nume || !email || !parola) {
        return res.status(400).json({ succes: false, mesaj: "Completeaza numele firmei, userul si parola!" });
    }

    const utilizatori = incarcaUtilizatori();
    if (utilizatori.find(u => u.email.toLowerCase() === email)) {
        return res.status(400).json({ succes: false, mesaj: "Acest user exista deja!" });
    }

    const dataExpirare = dataPesteZile(zile);
    utilizatori.push({ nume, email, parola, telefon: '-', rol: 'FIRMA', domeniu, firmaEmail: email, plan, dataExpirare });
    fs.writeFileSync(FISIER_UTILIZATORI, JSON.stringify(utilizatori, null, 2));

    const tarife = incarcaTarife();
    tarife[email] = JSON.parse(JSON.stringify(SABLON_DOMENII[domeniu] || SABLON_DOMENII['CONSTRUCTII']));
    fs.writeFileSync(FISIER_TARIFE, JSON.stringify(tarife, null, 2));

    res.json({ succes: true, mesaj: "Firma " + nume + " a fost creata cu planul " + plan + " (expira la " + dataExpirare + ")!" });
});

// LISTARE FIRME + CALCUL ZILE RĂMASE PENTRU ALERTĂ
app.get('/api/admin/firme', (req, res) => {
    const utilizatori = incarcaUtilizatori();
    const firme = utilizatori.filter(u => u.rol === 'FIRMA').map(f => ({
        ...f,
        zileRamase: calculeazaZileRamase(f.dataExpirare)
    }));
    res.json(firme);
});

// PRELUNGIRE ABONAMENT CU 30 DE ZILE (1 CLICK DIN ADMIN)
app.post('/api/admin/prelungire-abonament', (req, res) => {
    const emailFirma = (req.body.email || '').toLowerCase();
    const utilizatori = incarcaUtilizatori();
    const firma = utilizatori.find(u => u.email.toLowerCase() === emailFirma && u.rol === 'FIRMA');

fs.writeFileSync(FISIER_UTILIZATORI, JSON.stringify(utilizatori, null, 2));
    res.json({ succes: true, mesaj: "Abonamentul pentru " + firma.nume + " a fost prelungit pana la " + firma.dataExpirare + "!" });
});

// 4. CLIENTI FINALI
app.post('/api/admin/creare-client', (req, res) => {
    const nume = (req.body.nume || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const parola = (req.body.parola || '').trim();
    const telefon = (req.body.telefon || '-').trim();
    const firmaEmail = (req.body.firmaEmail || 'admin@leya.ro').trim().toLowerCase();

    if (!nume || !email || !parola) {
        return res.status(400).json({ succes: false, mesaj: "Completeaza numele, userul si parola!" });
    }

    const utilizatori = incarcaUtilizatori();
    if (utilizatori.find(u => u.email.toLowerCase() === email)) {
        return res.status(400).json({ succes: false, mesaj: "Acest user exista deja!" });
    }

    utilizatori.push({ nume, email, parola, telefon, rol: 'CLIENT', firmaEmail });
    fs.writeFileSync(FISIER_UTILIZATORI, JSON.stringify(utilizatori, null, 2));

    res.json({ succes: true, mesaj: "Contul pentru " + nume + " a fost creat!" });
});

app.get('/api/admin/clienti', (req, res) => {
    const firmaEmail = (req.query.firmaEmail || '').toLowerCase();
    const utilizatori = incarcaUtilizatori();
    res.json(utilizatori.filter(u => u.rol === 'CLIENT' && (!firmaEmail || (u.firmaEmail || 'admin@leya.ro').toLowerCase() === firmaEmail)));
});

// 5. OFERTE
app.post('/api/admin/creare-oferta', (req, res) => {
    const { firmaEmail, clientEmail, produs, pret, status } = req.body;
    const utilizatori = incarcaUtilizatori();
    const client = utilizatori.find(u => u.email.toLowerCase() === (clientEmail || '').toLowerCase() && u.rol === 'CLIENT');

    if (!client) {
        return res.status(404).json({ succes: false, mesaj: "Selecteaza un client valid!" });
    }

    const oferte = incarcaOferte();
    const ofertaNoua = {
        id: 100 + oferte.length + 1,
        firmaEmail: (firmaEmail || 'admin@leya.ro').toLowerCase(),
        clientEmail: client.email,
        clientNume: client.nume,
        produs: produs || 'Oferta calculata',
        pret: pret || '0 €',
        status: status || 'In asteptare',
        data: new Date().toLocaleDateString('ro-RO')
    };

    oferte.push(ofertaNoua);
    fs.writeFileSync(FISIER_OFERTE, JSON.stringify(oferte, null, 2));

    res.json({ succes: true, mesaj: "Oferta #" + ofertaNoua.id + " (" + ofertaNoua.pret + ") a fost trimisa catre " + client.nume + "!" });
});

app.get('/api/admin/oferte', (req, res) => {
    const firmaEmail = (req.query.firmaEmail || '').toLowerCase();
    const oferte = incarcaOferte();
    res.json(oferte.filter(o => !firmaEmail || (o.firmaEmail || 'admin@leya.ro').toLowerCase() === firmaEmail));
});

// 6. CLIENT FINAL IZOLAT
app.get('/api/client/date-personale', (req, res) => {
    const emailClient = (req.query.email || '').toLowerCase();
    const toateOfertele = incarcaOferte();

    const oferteleMele = toateOfertele.filter(o => o.clientEmail.toLowerCase() === emailClient);
    const totalInAsteptare = toateOfertele.filter(o => o.status === 'In asteptare').length;

    res.json({
        numarOferteleMele: oferteleMele.length,
        totalClientiInAsteptare: totalInAsteptare,
        oferteleMele: oferteleMele
    });
});

// Protecție globală: serverul nu se oprește niciodată la o eroare minoră
process.on('uncaughtException', (err) => {
    console.error('Eroare prinsa in siguranta:', err.message);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Platforma LEYA Multi-Firma ruleaza stabil pe portul " + PORT);
});