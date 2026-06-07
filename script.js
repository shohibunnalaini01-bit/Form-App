// ===== KONFIGURASI SUPABASE =====
const SUPABASE_URL = 'https://jpkbzwmzzlqudkpjxtvm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LSqEXnT4UalRQJCdYYEfAA_CTw-NhVX';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== STATE =====
let currentUser = null;
let selectedSantri = null;
let kopData = {};
let allSantri = [];

// ===== INISIALISASI =====
document.addEventListener('DOMContentLoaded', async () => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (!storedUser) { window.location.href = 'login.html'; return; }
    currentUser = JSON.parse(storedUser);
    setupUI();
    setupEventListeners();
    await loadKop();
    await generateNoRegistrasi();
    await loadAllSantri();
    if (currentUser.role === 'admin') await loadUsers();
    document.getElementById('tanggal_masuk').valueAsDate = new Date();
});

// ===== SETUP UI =====
function setupUI() {
    document.getElementById('userName').textContent = currentUser.nama;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.nama.charAt(0).toUpperCase();
    document.getElementById('badgeRole').textContent = currentUser.role;
    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page === 'pengaturan' && currentUser.role !== 'admin') {
                showToast('Anda tidak memiliki akses', 'error');
                return;
            }
            switchPage(page);
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
    document.getElementById('formSantri').addEventListener('submit', handleFormSubmit);
    document.getElementById('cetakSearch').addEventListener('input', handleCetakSearch);
    document.getElementById('dataSearch').addEventListener('input', handleDataSearch);

    const uploadZone = document.getElementById('uploadZone');
    const logoFileInput = document.getElementById('logoFileInput');
    uploadZone.addEventListener('click', () => logoFileInput.click());
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault(); uploadZone.style.borderColor = 'var(--pengaturan)'; uploadZone.style.background = 'var(--pengaturan-light)';
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--border)'; uploadZone.style.background = '';
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault(); uploadZone.style.borderColor = 'var(--border)'; uploadZone.style.background = '';
        if (e.dataTransfer.files.length) handleLogoUpload(e.dataTransfer.files[0]);
    });
    logoFileInput.addEventListener('change', () => {
        if (logoFileInput.files.length) handleLogoUpload(logoFileInput.files[0]);
    });
}

// ===== NAVIGASI =====
function switchPage(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));
    document.getElementById(`page-${page}`).classList.add('page-active');
    const titles = { formulir:'Formulir Pendaftaran', cetak:'Cetak Dokumen', data:'Data Santri', pengaturan:'Pengaturan' };
    document.getElementById('pageTitle').textContent = titles[page] || '';
    if (page === 'data') loadAllSantri();
    if (page === 'pengaturan') { loadKop(); loadUsers(); }
    if (page === 'formulir') generateNoRegistrasi();
}

// ===== NO REGISTRASI =====
async function generateNoRegistrasi() {
    try {
        const year = new Date().getFullYear();
        const { count, error } = await supabaseClient.from('santri').select('*', { count: 'exact', head: true });
        if (error) throw error;
        document.getElementById('no_registrasi').value = `REG-${year}-${String((count||0)+1).padStart(4,'0')}`;
    } catch (err) {
        document.getElementById('no_registrasi').value = `REG-${Date.now().toString().slice(-6)}`;
    }
}

// ===== KUMPULKAN BERKAS =====
function kumpulkanBerkas() {
    const berkas = [];
    const checklist = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checklist.forEach(cb => { if (cb.checked) berkas.push(cb.value); });
    return berkas.join('; ');
}

// ===== SIMPAN FORMULIR =====
async function handleFormSubmit(e) {
    e.preventDefault();
    const data = {
        no_registrasi: val('no_registrasi'),
        nama_lengkap: val('nama_lengkap'),
        nik: val('nik'),
        tempat_lahir: val('tempat_lahir'),
        tanggal_lahir: val('tanggal_lahir'),
        jenis_kelamin: val('jenis_kelamin'),
        agama: val('agama'),
        alamat: val('alamat'),
        rt_rw: val('rt_rw'),
        desa: val('desa'),
        kecamatan: val('kecamatan'),
        kabupaten: val('kabupaten'),
        provinsi: val('provinsi'),
        no_kk: val('no_kk'),
        nama_kepala_keluarga: val('nama_kepala_keluarga'),
        nama_ayah: val('nama_ayah'),
        nik_ayah: val('nik_ayah'),
        pekerjaan_ayah: val('pekerjaan_ayah'),
        no_hp_ayah: val('no_hp_ayah'),
        nama_ibu: val('nama_ibu'),
        nik_ibu: val('nik_ibu'),
        pekerjaan_ibu: val('pekerjaan_ibu'),
        no_hp_ibu: val('no_hp_ibu'),
        jumlah_saudara: parseInt(val('jumlah_saudara')) || 0,
        anak_ke: parseInt(val('anak_ke')) || 1,
        pendidikan_terakhir: val('pendidikan_terakhir'),
        asal_sekolah: val('asal_sekolah'),
        kelas: val('kelas'),
        kamar: val('kamar'),
        tanggal_masuk: val('tanggal_masuk'),
        nama_wali: val('nama_wali'),
        hubungan_wali: val('hubungan_wali'),
        no_hp_wali: val('no_hp_wali'),
        alamat_wali: val('alamat_wali'),
        kelengkapan_berkas: kumpulkanBerkas(),
        petugas_input: currentUser.nama
    };
    try {
        const { error } = await supabaseClient.from('santri').insert([data]);
        if (error) throw error;
        showToast('Data santri berhasil disimpan!', 'success');
        document.getElementById('formSantri').reset();
        document.getElementById('agama').value = 'Islam';
        document.getElementById('tanggal_masuk').valueAsDate = new Date();
        await generateNoRegistrasi();
    } catch (err) {
        showToast('Gagal menyimpan: ' + err.message, 'error');
    }
}

function val(id) { return document.getElementById(id).value.trim(); }

// ===== LOAD DATA =====
async function loadAllSantri() {
    try {
        const { data, error } = await supabaseClient.from('santri').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allSantri = data || [];
        renderDataTable(allSantri);
    } catch (err) { console.error(err); }
}

function renderDataTable(data) {
    const tbody = document.getElementById('dataTableBody');
    const empty = document.getElementById('emptyData');
    const countEl = document.getElementById('dataCount');
    if (data.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; countEl.textContent = '0 data'; return; }
    empty.style.display = 'none';
    countEl.textContent = `${data.length} data`;
    tbody.innerHTML = data.map((s, i) => `
        <tr>
            <td>${i+1}</td>
            <td><strong>${s.no_registrasi}</strong></td>
            <td>${s.nama_lengkap}</td>
            <td>${s.jenis_kelamin==='Laki-laki'?'L':'P'}</td>
            <td>${s.pendidikan_terakhir||'-'}</td>
            <td>${s.kelas?'Kelas '+s.kelas:'-'}</td>
            <td>${s.kamar||'-'}</td>
            <td>${formatDate(s.tanggal_masuk)}</td>
            <td><div class="action-btns">
                <button class="action-btn view" onclick="viewSantri('${s.id}')" title="Detail"><i class="fas fa-eye"></i></button>
                <button class="action-btn delete" onclick="deleteSantri('${s.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`).join('');
}

function handleDataSearch(e) {
    const q = e.target.value.toLowerCase();
    renderDataTable(allSantri.filter(s =>
        s.nama_lengkap.toLowerCase().includes(q) || s.no_registrasi.toLowerCase().includes(q) || (s.kamar && s.kamar.toLowerCase().includes(q))
    ));
}

function viewSantri(id) {
    const s = allSantri.find(x => x.id === id);
    if (!s) return;
    const berkasHTML = s.kelengkapan_berkas
        ? s.kelengkapan_berkas.split('; ').map(b => `<div style="display:flex;align-items:center;gap:0.4rem;margin:0.2rem 0"><i class="fas fa-check-circle" style="color:var(--formulir);font-size:0.75rem"></i> ${b}</div>`).join('')
        : '<span style="color:var(--text-muted)">Tidak ada data</span>';
    document.getElementById('detailContent').innerHTML = `
        <div class="detail-section-title">Data Pribadi</div>
        <div class="detail-grid">
            <div class="detail-item"><div class="detail-label">No. Registrasi</div><div class="detail-value">${s.no_registrasi}</div></div>
            <div class="detail-item"><div class="detail-label">Nama Lengkap</div><div class="detail-value">${s.nama_lengkap}</div></div>
            <div class="detail-item"><div class="detail-label">NIK</div><div class="detail-value">${s.nik||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Tempat, Tgl Lahir</div><div class="detail-value">${s.tempat_lahir||'-'}, ${formatDate(s.tanggal_lahir)}</div></div>
            <div class="detail-item"><div class="detail-label">Jenis Kelamin</div><div class="detail-value">${s.jenis_kelamin||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Alamat</div><div class="detail-value">${s.alamat||'-'}</div></div>
        </div>
        <div class="detail-section-title">Pendidikan & Kamar</div>
        <div class="detail-grid">
            <div class="detail-item"><div class="detail-label">Pendidikan</div><div class="detail-value">${s.pendidikan_terakhir||'-'}</div></div>
            <div class="detail-item"><div class="detail-label">Kelas / Kamar</div><div class="detail-value">Kelas ${s.kelas||'-'} / ${s.kamar||'-'}</div></div>
        </div>
        <div class="detail-section-title">Kelengkapan Berkas</div>
        <div style="padding:0.5rem 0">${berkasHTML}</div>`;
    openModal('detailModal');
}

async function deleteSantri(id) {
    if (!confirm('Yakin ingin menghapus data santri ini?')) return;
    try {
        const { error } = await supabaseClient.from('santri').delete().eq('id', id);
        if (error) throw error;
        showToast('Data berhasil dihapus', 'success');
        await loadAllSantri();
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
}

// ===== CETAK SEARCH =====
let searchTimeout = null;
function handleCetakSearch(e) {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    const r = document.getElementById('cetakResults');
    if (q.length < 2) { r.innerHTML = ''; return; }
    searchTimeout = setTimeout(() => {
        const results = allSantri.filter(s =>
            s.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || s.no_registrasi.toLowerCase().includes(q.toLowerCase())
        );
        r.innerHTML = results.length ? results.map(s => `
            <div class="search-result-item" onclick="selectSantriForCetak('${s.id}')">
                <div><div class="result-nama">${s.nama_lengkap}</div>
                <div class="result-reg">${s.no_registrasi} | Kelas ${s.kelas||'-'} | ${s.kamar||'-'}</div></div>
                <i class="fas fa-chevron-right" style="color:var(--text-muted);font-size:0.8rem"></i>
            </div>`).join('') : '<p style="padding:1rem;color:var(--text-muted);font-size:0.85rem">Tidak ditemukan</p>';
    }, 300);
}

function selectSantriForCetak(id) {
    selectedSantri = allSantri.find(s => s.id === id);
    if (!selectedSantri) return;
    document.getElementById('selectedSantriCard').style.display = 'block';
    document.getElementById('selSantriNama').textContent = selectedSantri.nama_lengkap;
    document.getElementById('selSantriReg').textContent = `${selectedSantri.no_registrasi} | Kelas ${selectedSantri.kelas||'-'} | ${selectedSantri.kamar||'-'}`;
    document.getElementById('cetakResults').innerHTML = '';
    document.getElementById('cetakSearch').value = '';
    document.getElementById('btnCetakFormulir').disabled = false;
    document.getElementById('btnCetakPernyataan').disabled = false;
    document.getElementById('btnCetakMerokok').disabled = false;
}

function clearSelectedSantri() {
    selectedSantri = null;
    document.getElementById('selectedSantriCard').style.display = 'none';
    document.getElementById('btnCetakFormulir').disabled = true;
    document.getElementById('btnCetakPernyataan').disabled = true;
    document.getElementById('btnCetakMerokok').disabled = true;
}

// ===== CETAK DOKUMEN =====
function cetakDokumen(jenis) {
    if (!selectedSantri) { showToast('Pilih santri terlebih dahulu', 'error'); return; }
    const s = selectedSantri, kop = kopData, petugas = currentUser.nama;
    const namaWali = s.nama_wali || s.nama_ayah || '-';
    const tanggal = formatTanggalPanjang(new Date());
    let html = '';
    if (jenis === 'formulir') html = generateFormulirHTML(s, kop, petugas, namaWali, tanggal);
    else if (jenis === 'pernyataan') html = generatePernyataanHTML(s, kop, petugas, namaWali, tanggal);
    else if (jenis === 'merokok') html = generateMerokokHTML(s, kop, petugas, namaWali, tanggal);
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close();
    w.onload = () => w.print();
}

// ===== KOP HTML (UKURAN LEBIH KECIL) =====
function generateKopHTML(kop) {
    if (kop.logo_url && kop.logo_url.trim() !== '') {
        return `<div style="text-align:center;margin-bottom:12px">
            <img src="${kop.logo_url}" alt="Kop" style="width:100%;max-height:70px;object-fit:contain">
        </div>`;
    }
    return `<div style="text-align:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:12px">
        <h1 style="font-size:14pt;margin:4px 0;text-transform:uppercase">NAMA PESANTREN</h1>
        <p style="font-size:9pt;margin:2px 0">Upload kop di Pengaturan</p>
    </div>`;
}

// ===== FORMULIR HTML =====
function generateFormulirHTML(s, kop, petugas, namaWali, tanggal) {
    const berkasList = s.kelengkapan_berkas
        ? s.kelengkapan_berkas.split('; ').map(b => `<tr><td style="padding:2px 8px"><input type="checkbox" checked disabled></td><td style="padding:2px 8px">${b}</td></tr>`).join('')
        : '<tr><td colspan="2" style="padding:2px 8px;color:#999">Tidak ada</td></tr>';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Formulir - ${s.nama_lengkap}</title>
<style>@page{size:F4;margin:1.27cm}body{font-family:'Times New Roman',serif;font-size:11pt;color:#000;line-height:1.4}
.judul{text-align:center;font-size:13pt;font-weight:bold;margin:12px 0;text-decoration:underline}
table.f4{width:100%;border-collapse:collapse;margin-bottom:12px}
table.f4 td,table.f4 th{padding:4px 8px;border:1px solid #000;vertical-align:top;font-size:10.5pt}
table.f4 th{background:#f0f0f0;font-weight:bold;width:180px}
table.berkas{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10pt}
table.berkas td{padding:3px 8px;border:1px solid #ccc}
.ttd-wrapper{display:flex;justify-content:space-between;margin-top:24px}
.ttd-box{text-align:center;width:45%}
.ttd-box .nama{font-weight:bold;border-bottom:1px solid #000;display:inline-block;min-width:180px;padding-bottom:2px;margin-top:55px}
</style></head><body>
 ${generateKopHTML(kop)}
<div class="judul">FORMULIR PENDAFTARAN SANTRI BARU</div>
<table class="f4">
<tr><th>No. Registrasi</th><td colspan="3"><strong>${s.no_registrasi}</strong></td></tr>
<tr><th>Nama Lengkap</th><td colspan="3">${s.nama_lengkap}</td></tr>
<tr><th>NIK</th><td colspan="3">${s.nik||'-'}</td></tr>
<tr><th>Tempat, Tgl Lahir</th><td colspan="3">${s.tempat_lahir||'-'}, ${formatDate(s.tanggal_lahir)}</td></tr>
<tr><th>Jenis Kelamin</th><td>${s.jenis_kelamin||'-'}</td><th>Agama</th><td>${s.agama||'Islam'}</td></tr>
<tr><th>Alamat</th><td colspan="3">${s.alamat||'-'}</td></tr>
<tr><th>No. KK</th><td colspan="3">${s.no_kk||'-'}</td></tr>
<tr><th>Nama Ayah</th><td>${s.nama_ayah||'-'}</td><th>Pekerjaan</th><td>${s.pekerjaan_ayah||'-'}</td></tr>
<tr><th>Nama Ibu</th><td>${s.nama_ibu||'-'}</td><th>Pekerjaan</th><td>${s.pekerjaan_ibu||'-'}</td></tr>
<tr><th>Pendidikan</th><td>${s.pendidikan_terakhir||'-'}</td><th>Asal Sekolah</th><td>${s.asal_sekolah||'-'}</td></tr>
<tr><th>Kelas</th><td>${s.kelas?'Kelas '+s.kelas:'-'}</td><th>Kamar</th><td>${s.kamar||'-'}</td></tr>
<tr><th>Tanggal Masuk</th><td colspan="3">${formatDate(s.tanggal_masuk)}</td></tr>
<tr><th>Petugas Input</th><td colspan="3">${petugas}</td></tr>
</table>
<div style="font-weight:bold;margin-bottom:4px">Kelengkapan Berkas:</div>
<table class="berkas">${berkasList}</table>
<div class="ttd-wrapper">
<div class="ttd-box"><div>Wali / Orang Tua</div><div class="nama">${namaWali}</div></div>
<div class="ttd-box"><div>Petugas Pesantren</div><div class="nama">${petugas}</div></div>
</div></body></html>`;
}

// ===== PERNYATAAN HTML =====
function generatePernyataanHTML(s, kop, petugas, namaWali, tanggal) {
    const np = kop.nama_pesantren || 'Pesantren';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surat Pernyataan - ${s.nama_lengkap}</title>
<style>@page{size:F4;margin:1.27cm}body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;line-height:1.6;text-align:justify}
.judul{text-align:center;font-size:13pt;font-weight:bold;margin:20px 0 4px}.sub-judul{text-align:center;font-size:10pt;margin-bottom:16px}
.isi{margin-bottom:16px;text-indent:40px}.list-roman{list-style-type:lower-roman;padding-left:60px;margin:8px 0}.list-roman li{margin-bottom:4px}
.ttd-wrapper{display:flex;justify-content:space-between;margin-top:40px}.ttd-box{text-align:center;width:45%}
.ttd-box .nama{font-weight:bold;border-bottom:1px solid #000;display:inline-block;min-width:180px;padding-bottom:2px;margin-top:55px}
.tempat-tgl{text-align:right;margin-bottom:12px}
</style></head><body>
 ${generateKopHTML(kop)}
<div class="judul">SURAT PERNYATAAN</div><div class="sub-judul">SIAP MENGIKUTI ATURAN DAN TATA TERTIB PESANTREN</div>
<div class="tempat-tgl">..........., ${tanggal}</div>
<div style="margin-bottom:16px">Yang bertanda tangan di bawah ini:</div>
<table style="margin-left:40px;margin-bottom:16px;font-size:12pt">
<tr><td style="width:160px">Nama</td><td>: <strong>${namaWali}</strong></td></tr>
<tr><td>Nama Santri</td><td>: <strong>${s.nama_lengkap}</strong></td></tr>
<tr><td>No. Registrasi</td><td>: ${s.no_registrasi}</td></tr>
</table>
<div class="isi">Dengan ini menyatakan bahwa saya selaku wali dari santri tersebut, bersedia dan siap untuk:</div>
<ol class="list-roman">
<li>Menjamin bahwa santri akan mentaati segala peraturan dan tata tertib di ${np}.</li>
<li>Bertanggung jawab atas pendidikan dan pembinaan santri.</li>
<li>Membayar biaya pendidikan secara tepat waktu sesuai ketentuan.</li>
<li>Menerima segala konsekuensi apabila santri melanggar peraturan pesantren.</li>
</ol>
<div class="isi">Demikian surat pernyataan ini dibuat dengan penuh kesadaran tanpa paksaan.</div>
<div class="ttd-wrapper">
<div class="ttd-box"><div>Wali / Orang Tua</div><div class="nama">${namaWali}</div></div>
<div class="ttd-box"><div>Petugas ${np}</div><div class="nama">${petugas}</div></div>
</div></body></html>`;
}

// ===== MEROKOK HTML =====
function generateMerokokHTML(s, kop, petugas, namaWali, tanggal) {
    const np = kop.nama_pesantren || 'Pesantren';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surat Tidak Merokok - ${s.nama_lengkap}</title>
<style>@page{size:F4;margin:1.27cm}body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;line-height:1.6;text-align:justify}
.judul{text-align:center;font-size:13pt;font-weight:bold;margin:20px 0 4px}.sub-judul{text-align:center;font-size:10pt;margin-bottom:16px}
.isi{margin-bottom:16px;text-indent:40px}.list-alpha{list-style-type:lower-alpha;padding-left:60px;margin:8px 0}.list-alpha li{margin-bottom:4px}
.ttd-wrapper{display:flex;justify-content:space-between;margin-top:40px}.ttd-box{text-align:center;width:30%}
.ttd-box .nama{font-weight:bold;border-bottom:1px solid #000;display:inline-block;min-width:150px;padding-bottom:2px;margin-top:55px}
.tempat-tgl{text-align:right;margin-bottom:12px}
.warning{text-align:center;font-weight:bold;font-size:11pt;margin:12px 0;padding:8px;border:1px solid #000}
</style></head><body>
 ${generateKopHTML(kop)}
<div class="judul">SURAT PERNYATAAN TIDAK MEROKOK</div><div class="sub-judul">BAGI SANTRI ${np.toUpperCase()}</div>
<div class="tempat-tgl">..........., ${tanggal}</div>
<div style="margin-bottom:16px">Yang bertanda tangan di bawah ini:</div>
<table style="margin-left:40px;margin-bottom:16px;font-size:12pt">
<tr><td style="width:160px">Nama Santri</td><td>: <strong>${s.nama_lengkap}</strong></td></tr>
<tr><td>No. Registrasi</td><td>: ${s.no_registrasi}</td></tr>
<tr><td>Kelas / Kamar</td><td>: Kelas ${s.kelas||'-'} / ${s.kamar||'-'}</td></tr>
</table>
<div class="isi">Menyatakan dengan sesungguhnya bahwa saya tidak akan merokok selama menjadi santri di ${np}, dan memahami bahwa:</div>
<ol class="list-alpha">
<li>Merokok dilarang keras di lingkungan ${np}.</li>
<li>Jika terbukti merokok, saya bersedia dikenakan sanksi sesuai peraturan.</li>
<li>Tidak akan membawa, menyimpan, atau mengedarkan rokok/vape di pesantren.</li>
</ol>
<div class="warning">MELANGGAR PERJANJIAN INI BERARTI BERSEDIA MENERIMA SANKSI</div>
<div class="ttd-wrapper">
<div class="ttd-box"><div>Santri</div><div class="nama">${s.nama_lengkap}</div></div>
<div class="ttd-box"><div>Wali / Orang Tua</div><div class="nama">${namaWali}</div></div>
<div class="ttd-box"><div>Petugas ${np}</div><div class="nama">${petugas}</div></div>
</div></body></html>`;
}

// ===== KOP =====
async function loadKop() {
    try {
        const { data } = await supabaseClient.from('settings').select('*').eq('key','kop_pesantren').single();
        if (data && data.value) {
            kopData = data.value;
            document.getElementById('setLogoUrl').value = kopData.logo_url || '';
            if (kopData.logo_url) {
                document.getElementById('logoPreview').style.display = 'block';
                document.getElementById('logoPreviewImg').src = kopData.logo_url;
            } else { document.getElementById('logoPreview').style.display = 'none'; }
        }
    } catch (err) { console.log('Belum ada kop'); }
}

async function simpanKop() {
    const logoUrl = document.getElementById('setLogoUrl').value.trim();
    if (!logoUrl) { showToast('Upload gambar kop terlebih dahulu', 'error'); return; }
    const data = { logo_url: logoUrl };
    try {
        const { data: existing } = await supabaseClient.from('settings').select('key').eq('key','kop_pesantren').single();
        let error;
        if (existing) {
            const r = await supabaseClient.from('settings').update({ value: data, updated_at: new Date().toISOString() }).eq('key','kop_pesantren');
            error = r.error;
        } else {
            const r = await supabaseClient.from('settings').insert([{ key:'kop_pesantren', value: data }]);
            error = r.error;
        }
        if (error) throw error;
        kopData = data;
        showToast('Kop berhasil disimpan', 'success');
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
}

async function handleLogoUpload(file) {
    if (!file || !file.type.startsWith('image/')) { showToast('File harus gambar', 'error'); return; }
    if (file.size > 2*1024*1024) { showToast('Maksimal 2MB', 'error'); return; }
    try {
        const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabaseClient.storage.from('pesantren-assets').upload(fileName, file, { cacheControl:'3600', upsert:true });
        if (error) throw error;
        const { data: urlData } = supabaseClient.storage.from('pesantren-assets').getPublicUrl(fileName);
        document.getElementById('setLogoUrl').value = urlData.publicUrl;
        document.getElementById('logoPreview').style.display = 'block';
        document.getElementById('logoPreviewImg').src = urlData.publicUrl;
        showToast('Logo berhasil diupload', 'success');
    } catch (err) { showToast('Gagal upload: ' + err.message, 'error'); }
}

// ===== KELOLA USER =====
async function loadUsers() {
    if (currentUser.role !== 'admin') return;
    try {
        const { data } = await supabaseClient.from('users').select('*').order('created_at', { ascending: true });
        document.getElementById('userTableBody').innerHTML = (data||[]).map(u => `
            <tr><td>${u.nama}</td><td>${u.username}</td>
            <td><span class="badge-role" style="background:${u.role==='admin'?'var(--pengaturan-light)':'var(--formulir-light)'};color:${u.role==='admin'?'var(--pengaturan)':'var(--formulir)'}">${u.role}</span></td>
            <td>${u.id!==currentUser.id?`<button class="action-btn delete" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>`:'-'}</td></tr>`).join('');
    } catch (err) { console.error(err); }
}

function showAddUserModal() { openModal('addUserModal'); }

async function tambahUser() {
    const nama = document.getElementById('newUserNama').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    if (!nama || !username || !password) { showToast('Semua field harus diisi', 'error'); return; }
    try {
        const { error } = await supabaseClient.from('users').insert([{ nama, username, password, role }]);
        if (error) throw error;
        showToast('User berhasil ditambahkan', 'success');
        closeModal('addUserModal');
        document.getElementById('newUserNama').value = '';
        document.getElementById('newUserUsername').value = '';
        document.getElementById('newUserPassword').value = '';
        await loadUsers();
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
}

async function deleteUser(id) {
    if (!confirm('Yakin hapus user ini?')) return;
    try {
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) throw error;
        showToast('User dihapus', 'success');
        await loadUsers();
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
}

// ===== MODAL & TOAST =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show'); });

function showToast(msg, type='info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icon = type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle';
    t.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

function formatDate(d) { if(!d) return '-'; return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function formatTanggalPanjang(d) { return d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}); }