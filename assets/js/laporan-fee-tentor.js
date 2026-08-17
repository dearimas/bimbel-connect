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
const totalFeetentorEl = document.getElementById("totalFeetentor");
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

    const firstDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
    );

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
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div>Belum ada data fee tentor untuk periode ini.</div>
        </div>
    `;

    totalFeetentorEl.textContent = formatRupiah(0);
}


async function fetchReportData(startDate, endDate) {

    console.log(
        `Calling laporan_fee_tentor('${startDate}', '${endDate}')`
    );

    const { data, error } = await supabaseClient.rpc(
        "laporan_fee_tentor",
        {
            p_awal: startDate,
            p_akhir: endDate,
        }
    );

    if (error) {
        throw error;
    }

    console.log("Response data:", data);

    return Array.isArray(data) ? data : [];
}


/*
 * Group data berdasarkan tentor.
 *
 * Contoh data dari RPC:
 *
 * T36 | Dimas | Coding - SD 4 | fee 100.000
 * T36 | Dimas | Reguler - SD 4 | fee 150.000
 * T11 | Indah | Privat - SD 2 | fee 50.000
 *
 * Akan menjadi:
 *
 * T36
 *   - Coding
 *   - Reguler
 *
 * T11
 *   - Privat
 */
function groupByTentor(rows) {

    const grouped = {};

    rows.forEach((row) => {

        const kode = row.tentor_kode;

        if (!grouped[kode]) {

            grouped[kode] = {
                tentor_kode: row.tentor_kode,
                tentor: row.tentor,
                total_fee: 0,
                total_kbm: 0,
                total_jam_kosong: 0,
                total_mengajar: 0,
                details: [],
            };
        }

        const fee = Number(row.fee || 0);
        const totalKbm = Number(row.total_kbm || 0);
        const jamKosong = Number(row.total_jam_kosong || 0);
        const mengajar = Number(row.total_mengajar || 0);

        /*
         * PENTING:
         * Jangan pakai row.total_fee_tentor.
         *
         * Karena nilai tersebut bisa muncul
         * berulang di setiap jenis bimbingan.
         *
         * Kita jumlahkan fee masing-masing row.
         */
        grouped[kode].total_fee += fee;

        grouped[kode].total_kbm += totalKbm;
        grouped[kode].total_jam_kosong += jamKosong;
        grouped[kode].total_mengajar += mengajar;

        grouped[kode].details.push({
            jenis_bimbingan: row.jenis_bimbingan || "-",
            tingkat: row.tingkat || "-",
            total_kbm: totalKbm,
            total_jam_kosong: jamKosong,
            total_mengajar: mengajar,
            fee: fee,
        });
    });

    return Object.values(grouped);
}


function renderRows(rows) {

    if (!rows.length) {
        renderEmptyState();
        return;
    }

    const tentorList = groupByTentor(rows);

    /*
     * Total seluruh fee.
     */
    const grandTotal = tentorList.reduce(
        (sum, tentor) => sum + tentor.total_fee,
        0
    );

    totalFeetentorEl.textContent = formatRupiah(grandTotal);


    reportContainer.innerHTML = tentorList
        .map((tentor) => {

            return `
                <div class="tentor-card">

                    <!-- HEADER TENTOR -->
                    <div class="tentor-card-header">

                        <div class="tentor-profile">

                            <div class="tentor-avatar">
                                👨‍🏫
                            </div>

                            <div>
                                <div class="tentor-name">
                                    ${tentor.tentor || "-"}
                                </div>

                                <div class="tentor-code">
                                    Kode Tentor: ${tentor.tentor_kode || "-"}
                                </div>
                            </div>

                        </div>


                        <div class="tentor-total">

                            <span>
                                TOTAL FEE
                            </span>

                            <strong>
                                ${formatRupiah(tentor.total_fee)}
                            </strong>

                        </div>

                    </div>


                    <!-- SUMMARY -->
                    <div class="tentor-summary">

                        <div class="summary-item">
                            <span>Total KBM</span>
                            <strong>
                                ${tentor.total_kbm}
                            </strong>
                        </div>

                        <div class="summary-item">
                            <span>Jam Efektif</span>
                            <strong>
                                ${tentor.total_mengajar}
                            </strong>
                        </div>

                        <div class="summary-item">
                            <span>Jam Kosong</span>
                            <strong>
                                ${tentor.total_jam_kosong}
                            </strong>
                        </div>

                        <div class="summary-item fee-summary">
                            <span>Perolehan</span>
                            <strong>
                                ${formatRupiah(tentor.total_fee)}
                            </strong>
                        </div>

                    </div>


                    <!-- DETAIL -->
                    <div class="tentor-detail">

                        <div class="detail-title">
                            <span>Detail Bimbingan</span>
                            <span>${tentor.details.length} jenis</span>
                        </div>


                        <div class="detail-table">

                            <div class="detail-row detail-head">

                                <div>
                                    Jenis Bimbingan
                                </div>

                                <div>
                                    KBM
                                </div>

                                <div>
                                    Kosong
                                </div>

                                <div>
                                    Efektif
                                </div>

                                <div>
                                    Fee
                                </div>

                            </div>


                            ${tentor.details
                                .map((detail) => {

                                    return `
                                        <div class="detail-row">

                                            <div class="jenis-bimbingan">
                                                <strong>
                                                    ${detail.jenis_bimbingan}
                                                </strong>

                                                <small>
                                                    ${detail.tingkat}
                                                </small>
                                            </div>

                                            <div>
                                                ${detail.total_kbm}
                                            </div>

                                            <div>
                                                ${detail.total_jam_kosong}
                                            </div>

                                            <div>
                                                ${detail.total_mengajar}
                                            </div>

                                            <div class="detail-fee">
                                                ${formatRupiah(detail.fee)}
                                            </div>

                                        </div>
                                    `;

                                })
                                .join("")}

                        </div>

                    </div>

                </div>
            `;

        })
        .join("");
}


function updatePeriodeLabel(startDate, endDate) {

    periodeLabel.textContent =
        `Periode: ${formatDate(startDate)} sampai ${formatDate(endDate)}`;
}


async function loadReport() {

    const startDate = tanggalAwalInput.value;
    const endDate = tanggalAkhirInput.value;


    if (!startDate || !endDate) {

        renderEmptyState();

        periodeLabel.textContent =
            "Pilih tanggal untuk menampilkan laporan.";

        return;
    }


    if (startDate > endDate) {

        periodeLabel.textContent =
            "Tanggal awal tidak boleh lebih besar dari tanggal akhir.";

        renderEmptyState();

        return;
    }


    try {

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        if (!session) {

            window.location.href = "index.html";

            return;
        }


        const rows = await fetchReportData(
            startDate,
            endDate
        );


        renderRows(rows);

        updatePeriodeLabel(
            startDate,
            endDate
        );


    } catch (error) {

        console.error(
            "Gagal memuat laporan fee tentor:",
            error
        );

        periodeLabel.textContent =
            error?.message ||
            "Terjadi kesalahan saat memuat laporan.";

        renderEmptyState();
    }
}


filterForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        await loadReport();
    }
);


resetFilterButton.addEventListener(
    "click",
    () => {

        setDefaultRange();

        loadReport();
    }
);


setDefaultRange();

loadReport();
