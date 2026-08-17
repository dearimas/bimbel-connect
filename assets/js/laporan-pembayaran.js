const SUPABASE_URL = "https://ipnoshuvofomxwssamma.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const filterForm = document.getElementById("filterForm");
const tanggalAwalInput = document.getElementById("tanggalAwal");
const tanggalAkhirInput = document.getElementById("tanggalAkhir");
const resetFilterButton = document.getElementById("resetFilter");
const reportTableBody = document.getElementById("reportTableBody");
const totalPenerimaanEl = document.getElementById("totalPenerimaan");
const jenisTransaksiSummaryEl = document.getElementById("jenisTransaksiSummary");
const periodeLabel = document.getElementById("periodeLabel");

function formatRupiah(value) {
    const nominal = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(nominal);
}

function formatNumberWithSeparator(value) {
    const nominal = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(nominal);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function getJenisTransaksi(kode = "") {
    const value = String(kode || "").toUpperCase();

    if (value.startsWith("DFT")) {
        return "Pendaftaran Siswa Baru";
    }

    if (value.startsWith("RTG")) {
        return "Pembayaran Biaya Reguler";
    }

    if (value.startsWith("PKT")) {
        return "Pembelian Paket Bimbingan";
    }

    return "-";
}

function getMetodePembayaran(row) {
    const methods = [];

    if (Number(row.tunai || 0) > 0) methods.push(`Tunai (${formatNumberWithSeparator(row.tunai)})`);
    if (Number(row.qris || 0) > 0) methods.push(`QRIS (${formatNumberWithSeparator(row.qris)})`);
    if (Number(row.transfer_bank || 0) > 0) methods.push(`Transfer Bank (${formatNumberWithSeparator(row.transfer_bank)})`);
    if (Number(row.transfer || 0) > 0) methods.push(`Transfer (${formatNumberWithSeparator(row.transfer)})`);
    if (Number(row.voucher || 0) > 0) methods.push(`Voucher (${formatNumberWithSeparator(row.voucher)})`);

    return methods.length ? methods.join(", ") : "-";
}

function setDefaultRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    tanggalAwalInput.value = formatDateForInput(firstDay);
    tanggalAkhirInput.value = formatDateForInput(lastDay);
}

function renderSummaryByType(rows) {
    const typeLabels = [
        "Pendaftaran Siswa Baru",
        "Pembayaran Biaya Reguler",
        "Pembelian Paket Bimbingan"
    ];

    const totals = rows.reduce((acc, item) => {
        const name = item.jenis_transaksi || "-";
        acc[name] = (acc[name] || 0) + Number(item.total_bayar || 0);
        return acc;
    }, {});

    jenisTransaksiSummaryEl.innerHTML = typeLabels
        .map((label) => {
            const total = totals[label] || 0;
            return `
                <div class="jenis-item">
                    <span>${label}</span>
                    <strong>${formatRupiah(total)}</strong>
                </div>
            `;
        })
        .join("");
}

function renderEmptyState() {
    reportTableBody.innerHTML = `
        <tr>
            <td colspan="11" class="empty-state">Belum ada data laporan untuk ditampilkan.</td>
        </tr>
    `;

    totalPenerimaanEl.textContent = formatRupiah(0);
    renderSummaryByType([]);
}

function renderRows(rows) {
    if (!rows.length) {
        renderEmptyState();
        return;
    }

    const totalPenerimaan = rows.reduce((sum, item) => sum + Number(item.total_bayar || 0), 0);
    totalPenerimaanEl.textContent = formatRupiah(totalPenerimaan);
    renderSummaryByType(rows);

    reportTableBody.innerHTML = rows
        .map((row, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${row.kode_transaksi || "-"}</span></td>
                <td>${formatDate(row.tanggal)}</td>
                <td>${row.jenis_transaksi || "-"}</td>
                <td>${row.siswa || "-"}</td>
                <td>${row.kelas || "-"}</td>
                <td>${row.tingkat || "-"}</td>
                <td>${row.catatan || "-"}</td>
                <td class="currency">${formatRupiah(row.total_bayar)}</td>
                <td>${getMetodePembayaran(row)}</td>
                <td class="currency">${formatRupiah(row.uang_kembali)}</td>
            </tr>
        `)
        .join("");
}

async function fetchReportData(startDate, endDate) {
    const { data, error } = await supabaseClient.rpc("laporan_pembayaran", {
        p_tanggalawal: startDate,
        p_tanggalakhir: endDate
    });

    if (error) {
        throw error;
    }

    return (Array.isArray(data) ? data : []).map((row) => ({
        kode_transaksi: row.kode_transaksi,
        tanggal: row.tanggal,
        jenis_transaksi: row.jenis_transaksi,
        siswa: row.siswa || "-",
        kelas: row.kelas || "-",
        tingkat: row.tingkat || "-",
        catatan: row.catatan || "-",
        total_bayar: Number(row.total_bayar || 0),
        tunai: Number(row.tunai || 0),
        qris: Number(row.qris || 0),
        transfer_bank: Number(row.transfer_bank || 0),
        transfer: Number(row.transfer || 0),
        voucher: Number(row.voucher || 0),
        uang_kembali: Number(row.uang_kembali || 0),
    }));
}

function updatePeriodeLabel(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    periodeLabel.textContent = `Periode: ${start} sampai ${end}`;
}

async function loadReport() {
    const startDate = tanggalAwalInput.value;
    const endDate = tanggalAkhirInput.value;

    if (!startDate || !endDate) {
        renderEmptyState();
        periodeLabel.textContent = "Pilih tanggal untuk menampilkan laporan.";
        return;
    }

    if (startDate > endDate) {
        periodeLabel.textContent = "Tanggal awal tidak boleh lebih besar dari tanggal akhir.";
        renderEmptyState();
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session) {
            window.location.href = "index.html";
            return;
        }

        const rows = await fetchReportData(startDate, endDate);
        renderRows(rows);
        updatePeriodeLabel(startDate, endDate);
    } catch (error) {
        console.error("Gagal memuat laporan pembayaran:", error);
        const message = error?.message || "Terjadi kesalahan saat memuat laporan.";
        periodeLabel.textContent = message;
        renderEmptyState();
    }
}

filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadReport();
});

resetFilterButton.addEventListener("click", () => {
    setDefaultRange();
    loadReport();
});

setDefaultRange();
loadReport();
