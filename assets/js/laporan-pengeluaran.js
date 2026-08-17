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
const reportContainer = document.getElementById("reportContainer");
const totalPengeluaranEl = document.getElementById("totalPengeluaran");
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

function convertDateToFunctionFormat(isoDate) {
    if (!isoDate) return "";

    const [year, month, day] = isoDate.split("-");
    return `${Number(month)}/${Number(day)}/${year}`;
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
    reportContainer.innerHTML = `
        <div class="empty-state">Belum ada data laporan untuk ditampilkan.</div>
    `;
    totalPengeluaranEl.textContent = formatRupiah(0);
}

function renderRows(rows) {
    if (!rows.length) {
        renderEmptyState();
        return;
    }

    const groupedByCode = {};

    rows.forEach((row) => {
        const code = row.kode_transaksi || "Unknown";

        if (!groupedByCode[code]) {
            groupedByCode[code] = {
                kode_transaksi: code,
                tanggal: row.tanggal,
                details: [],
            };
        }

        groupedByCode[code].details.push({
            keterangan: row.keterangan || "-",
            nominal: Number(row.nominal || 0),
        });
    });

    const totalPengeluaran = rows.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
    totalPengeluaranEl.textContent = formatRupiah(totalPengeluaran);

    reportContainer.innerHTML = Object.values(groupedByCode)
        .map((group) => {
            const totalNominal = group.details.reduce(
                (sum, detail) => sum + detail.nominal,
                0
            );

            return `
                <div class="transaction-card">
                    <div class="transaction-header">
                        <div class="transaction-code">
                            <span>${group.kode_transaksi}</span>
                        </div>
                        <div class="transaction-date">${formatDate(group.tanggal)}</div>
                    </div>

                    <div class="detail-list">
                        ${group.details
                    .map(
                        (detail) => `
                            <div class="detail-item">
                                <div class="detail-text">${detail.keterangan}</div>
                                <div class="detail-nominal">${formatRupiah(detail.nominal)}</div>
                            </div>
                        `
                    )
                    .join("")}
                    </div>

                    <div style="padding-top: 12px; border-top: 1px solid var(--line); margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: var(--muted); font-size: 13px;">TOTAL TRANSAKSI</span>
                        <span style="font-size: 18px; font-weight: 800; color: var(--dark);">${formatRupiah(
                        totalNominal
                    )}</span>
                    </div>
                </div>
            `;
        })
        .join("");
}

async function fetchReportData(startDate, endDate) {
    const startDateFormatted = convertDateToFunctionFormat(startDate);
    const endDateFormatted = convertDateToFunctionFormat(endDate);

    console.log(`Calling laporan_pengeluaran('${startDateFormatted}', '${endDateFormatted}')`);

    const { data, error } = await supabaseClient.rpc("laporan_pengeluaran", {
        p_tanggalawal: startDateFormatted,
        p_tanggalakhir: endDateFormatted,
    });

    if (error) {
        throw error;
    }

    console.log("Response data:", data);

    return (Array.isArray(data) ? data : []).map((row) => ({
        kode_transaksi: row.kode_transaksi,
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
