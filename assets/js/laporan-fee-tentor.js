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
const totalFeeontorEl = document.getElementById("totalFeetentor");
const periodeLabel = document.getElementById("periodeLabel");

const detailModal = document.getElementById("detailModal");
const modalTitle = document.getElementById("modalTitle");
const detailTableBody = document.getElementById("detailTableBody");
const detailTotal = document.getElementById("detailTotal");
const closeModalBtn = document.getElementById("closeModal");

let currentReportData = [];
let currentDateRange = { start: "", end: "" };

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
    totalFeeontorEl.textContent = formatRupiah(0);
}

function renderRows(rows) {
    if (!rows.length) {
        renderEmptyState();
        return;
    }

    const totalFee = rows.reduce((sum, item) => sum + Number(item.total_fee_tentor || 0), 0);
    totalFeeontorEl.textContent = formatRupiah(totalFee);

    reportContainer.innerHTML = rows
        .map((row, index) => `
            <div class="tentor-card">
                <div class="tentor-row">
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Kode</span>
                        <span class="tentor-cell-value">${row.tentor_kode || "-"}</span>
                    </div>
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Nama Tentor</span>
                        <span class="tentor-cell-value">${row.tentor || "-"}</span>
                    </div>
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Jenis Bimbingan</span>
                        <span class="tentor-cell-value">${row.jenis_bimbingan || "-"}</span>
                    </div>
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Total KBM</span>
                        <span class="tentor-cell-value">${row.total_kbm || 0}</span>
                    </div>
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Jam Kosong</span>
                        <span class="tentor-cell-value">${row.total_jam_kosong || 0}</span>
                    </div>
                    <div class="tentor-cell">
                        <span class="tentor-cell-label">Total Fee</span>
                        <span class="tentor-cell-value currency">${formatRupiah(row.total_fee_tentor)}</span>
                    </div>
                    <button type="button" class="detail-btn" data-kode="${row.tentor_kode}">Detail</button>
                </div>
            </div>
        `)
        .join("");

    // Attach event listeners to detail buttons
    document.querySelectorAll(".detail-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const kode = e.target.getAttribute("data-kode");
            const tentor = rows.find((r) => r.tentor_kode === kode);
            openDetailModal(tentor);
        });
    });
}

async function fetchReportData(startDate, endDate) {
    const startDateFormatted = convertDateToFunctionFormat(startDate);
    const endDateFormatted = convertDateToFunctionFormat(endDate);

    console.log(`Calling laporan_fee_tentor('${startDateFormatted}', '${endDateFormatted}')`);

    const { data, error } = await supabaseClient.rpc("laporan_fee_tentor", {
        p_awal: startDateFormatted,
        p_akhir: endDateFormatted,
    });

    if (error) {
        throw error;
    }

    console.log("Response data:", data);

    return (Array.isArray(data) ? data : []).map((row) => ({
        tentor_kode: row.tentor_kode,
        tentor: row.tentor,
        jenis_bimbingan: row.jenis_bimbingan,
        total_kbm: Number(row.total_kbm || 0),
        total_jam_kosong: Number(row.total_jam_kosong || 0),
        total_mengajar: Number(row.total_mengajar || 0),
        fee: Number(row.fee || 0),
        total_fee_tentor: Number(row.total_fee_tentor || 0),
        tingkat: row.tingkat,
        awal: row.awal,
        akhir: row.akhir,
    }));
}

async function fetchDetailData(tentorKode, startDate, endDate) {
    const startDateFormatted = convertDateToFunctionFormat(startDate);
    const endDateFormatted = convertDateToFunctionFormat(endDate);

    console.log(`Calling laporan_fee_tentor_detail('${tentorKode}', '${startDateFormatted}', '${endDateFormatted}')`);

    const { data, error } = await supabaseClient.rpc("laporan_fee_tentor_detail", {
        p_tentor_kode: tentorKode,
        p_tanggal_awal: startDateFormatted,
        p_tanggal_akhir: endDateFormatted,
    });

    if (error) {
        throw error;
    }

    console.log("Detail data:", data);

    return (Array.isArray(data) ? data : []).map((row) => {
        console.log("Raw row:", row);
        return {
            tanggal: row.tanggal || "-",
            jenis_bimbingan: row.jenis_bimbingan || "-",
            kode: row.kode || "-",
            siswa: row.siswa || "-",
            keterangan: row.keterangan || "-",
            tarif: Number(row.fee || 0),
            tipe: row.tipe || "-",
        };
    });
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
        currentReportData = rows;
        currentDateRange = { start: startDate, end: endDate };
        renderRows(rows);
        updatePeriodeLabel(startDate, endDate);
    } catch (error) {
        console.error("Gagal memuat laporan fee tentor:", error);
        const message = error?.message || "Terjadi kesalahan saat memuat laporan.";
        periodeLabel.textContent = message;
        renderEmptyState();
    }
}

async function openDetailModal(tentor) {
    if (!tentor || !tentor.tentor_kode) {
        console.error("Invalid tentor data");
        return;
    }

    modalTitle.textContent = `Detail Fee - ${tentor.tentor} (${tentor.tentor_kode})`;
    detailTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Memuat detail...</td></tr>`;
    detailTotal.textContent = formatRupiah(0);

    detailModal.classList.add("show");

    try {
        const details = await fetchDetailData(
            tentor.tentor_kode,
            currentDateRange.start,
            currentDateRange.end
        );

        if (details.length === 0) {
            detailTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Tidak ada detail untuk tentor ini.</td></tr>`;
            detailTotal.textContent = formatRupiah(0);
            return;
        }

        const totalTarif = details.reduce((sum, item) => sum + item.tarif, 0);

        detailTableBody.innerHTML = details
            .map((detail, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${detail.tanggal || "-"}</td>
                    <td>${detail.jenis_bimbingan || "-"}</td>
                    <td>${detail.kode || "-"}</td>
                    <td>${detail.siswa || "-"}</td>
                    <td>${detail.keterangan || "-"}</td>
                    <td>${formatRupiah(detail.tarif)}</td>
                    <td>${detail.tipe || "-"}</td>
                </tr>
            `)
            .join("");

        detailTotal.textContent = formatRupiah(totalTarif);
    } catch (error) {
        console.error("Gagal memuat detail:", error);
        detailTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Gagal memuat detail: ${error.message}</td></tr>`;
    }
}

function closeDetail() {
    detailModal.classList.remove("show");
}

closeModalBtn.addEventListener("click", closeDetail);

detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
        closeDetail();
    }
});

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
