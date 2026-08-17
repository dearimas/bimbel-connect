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
const totalPengeluaranEl = document.getElementById("totalPengeluaran");
const totalPengeluaranFooterEl = document.getElementById("totalPengeluaranFooter");
const periodeLabel = document.getElementById("periodeLabel");

function formatRupiah(value) {
    const nominal = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
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

function renderEmptyState() {
    reportTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">Belum ada data laporan untuk ditampilkan.</td>
        </tr>
    `;

    totalPengeluaranEl.textContent = formatRupiah(0);
    totalPengeluaranFooterEl.textContent = formatRupiah(0);
}

function renderRows(rows) {
    if (!rows.length) {
        renderEmptyState();
        return;
    }

    const totalPengeluaran = rows.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
    totalPengeluaranEl.textContent = formatRupiah(totalPengeluaran);
    totalPengeluaranFooterEl.textContent = formatRupiah(totalPengeluaran);

    reportTableBody.innerHTML = rows
        .map((row, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><span class="badge">${row.kode_pengeluaran || "-"}</span></td>
                <td>${formatDate(row.tanggal)}</td>
                <td>${row.keterangan || "-"}</td>
                <td class="currency">${formatRupiah(row.nominal)}</td>
            </tr>
        `)
        .join("");
}

async function fetchReportData(startDate, endDate) {
    const { data, error } = await supabaseClient.rpc("laporan_pengeluaran", {
        p_tanggalawal: startDate,
        p_tanggalakhir: endDate,
    });

    if (error) {
        throw error;
    }

    return (Array.isArray(data) ? data : []).map((row) => ({
        kode_pengeluaran: row.kode_pengeluaran,
        tanggal: row.tanggal,
        keterangan: row.keterangan || "-",
        nominal: Number(row.nominal || 0),
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
        console.error("Gagal memuat laporan pengeluaran:", error);
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
