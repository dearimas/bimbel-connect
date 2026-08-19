const SUPABASE_URL =
    "https://ipnoshuvofomxwssamma.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================================================
// ELEMENT
// =========================================================

const filterForm =
    document.getElementById("filterForm");

const tanggalAwalInput =
    document.getElementById("tanggalAwal");

const tanggalAkhirInput =
    document.getElementById("tanggalAkhir");

const resetFilterButton =
    document.getElementById("resetFilter");

const reportContainer =
    document.getElementById("reportContainer");

const periodeLabel =
    document.getElementById("periodeLabel");

const totalFeeElement =
    document.getElementById("totalFee");

const lastUpdateElement =
    document.getElementById("lastUpdate");


// Modal

const detailModal =
    document.getElementById("detailModal");

const closeModalButton =
    document.getElementById("closeModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalSubtitle =
    document.getElementById("modalSubtitle");

const detailTableBody =
    document.getElementById("detailTableBody");

const detailTotal =
    document.getElementById("detailTotal");


// =========================================================
// FORMAT RUPIAH
// =========================================================

function formatRupiah(value) {

    const nominal =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(nominal);
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


// =========================================================
// FORMAT DATETIME
// =========================================================

function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


// =========================================================
// DEFAULT DATE
// =========================================================

function setDefaultRange() {

    const now =
        new Date();

    const firstDay =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

    const lastDay =
        new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        );


    function formatInputDate(date) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    tanggalAwalInput.value =
        formatInputDate(firstDay);

    tanggalAkhirInput.value =
        formatInputDate(lastDay);
}


// =========================================================
// EMPTY
// =========================================================

function renderEmptyState() {

    reportContainer.innerHTML = `
        <div class="empty-state">
            Belum ada data laporan untuk ditampilkan.
        </div>
    `;

    totalFeeElement.textContent =
        formatRupiah(0);

    lastUpdateElement.textContent =
        "-";
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================================
// GET INITIAL
// =========================================================

function getInitialName(name) {

    if (!name) {
        return "👨‍🏫";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}


// =========================================================
// FETCH LAPORAN UTAMA
// =========================================================

async function fetchReportData(
    startDate,
    endDate
) {

    console.log(
        "Calling laporan_fee_tentor:",
        startDate,
        endDate
    );


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "laporan_fee_tentor",
        {
            p_awal: startDate,
            p_akhir: endDate
        }
    );


    if (error) {
        throw error;
    }


    console.log(
        "Response laporan fee:",
        data
    );


    return Array.isArray(data)
        ? data
        : [];
}


// =========================================================
// GROUP BY TENTOR
// =========================================================

function groupByTentor(rows) {

    const grouped = {};


    rows.forEach(row => {

        const kode =
            row.tentor_kode;


        if (!grouped[kode]) {

            grouped[kode] = {

                tentor_kode:
                    row.tentor_kode,

                tentor:
                    row.tentor,

                total_kbm: 0,

                total_jam_kosong: 0,

                total_mengajar: 0,

                total_fee: 0,

                last_update:
                    row.last_update,

                details: []

            };

        }


        const item =
            grouped[kode];


        item.total_kbm +=
            Number(row.total_kbm || 0);

        item.total_jam_kosong +=
            Number(
                row.total_jam_kosong || 0
            );

        item.total_mengajar +=
            Number(
                row.total_mengajar || 0
            );


        /*
         * PENTING:
         *
         * Yang dijumlahkan adalah FEE
         * per jenis bimbingan.
         *
         * Bukan total_fee_tentor.
         */

        item.total_fee +=
            Number(row.fee || 0);


        item.details.push({

            jenis_bimbingan:
                row.jenis_bimbingan,

            total_kbm:
                Number(row.total_kbm || 0),

            total_jam_kosong:
                Number(
                    row.total_jam_kosong || 0
                ),

            total_mengajar:
                Number(
                    row.total_mengajar || 0
                ),

            fee:
                Number(row.fee || 0),

            tingkat:
                row.tingkat

        });


        /*
         * Ambil last_update terbesar
         * dari semua baris tentor.
         */

        if (
            row.last_update &&
            (
                !item.last_update ||
                new Date(row.last_update) >
                new Date(item.last_update)
            )
        ) {

            item.last_update =
                row.last_update;

        }

    });


    return Object.values(grouped);
}


// =========================================================
// RENDER LAPORAN
// =========================================================

function renderRows(rows) {

    if (!rows.length) {

        renderEmptyState();

        return;
    }


    const tentorList =
        groupByTentor(rows);


    /*
     * Total keseluruhan laporan.
     *
     * Menggunakan total_fee masing-masing tentor.
     */

    const totalLaporan =
        tentorList.reduce(
            (sum, tentor) =>
                sum +
                Number(
                    tentor.total_fee || 0
                ),
            0
        );


    totalFeeElement.textContent =
        formatRupiah(totalLaporan);


    /*
     * Ambil last update terbesar
     * dari seluruh laporan.
     */

    let globalLastUpdate = null;


    tentorList.forEach(tentor => {

        if (!tentor.last_update) {
            return;
        }


        if (
            !globalLastUpdate ||
            new Date(tentor.last_update) >
            new Date(globalLastUpdate)
        ) {

            globalLastUpdate =
                tentor.last_update;

        }

    });


    lastUpdateElement.textContent =
        globalLastUpdate
            ? formatDateTime(globalLastUpdate)
            : "-";


    /*
     * Render card tentor.
     */

    reportContainer.innerHTML =
        tentorList.map(
            tentor => {

                const detailRows =
                    tentor.details;


                return `
                    <div
                        class="tentor-card"
                    >

                        <!-- HEADER TENTOR -->
                        <div class="tentor-header">

                            <div class="tentor-info">

                                <div class="tentor-avatar">
                                    ${escapeHtml(
                                        getInitialName(
                                            tentor.tentor
                                        )
                                    )}
                                </div>

                                <div>

                                    <h3 class="tentor-name">
                                        ${escapeHtml(
                                            tentor.tentor
                                        )}
                                    </h3>

                                    <div class="tentor-code">
                                        Kode Tentor:
                                        ${escapeHtml(
                                            tentor.tentor_kode
                                        )}
                                    </div>

                                </div>

                            </div>


                            <div class="tentor-header-actions">

                                <button
                                    type="button"
                                    class="detail-btn"
                                    data-tentor-kode="${escapeHtml(
                                        tentor.tentor_kode
                                    )}"
                                    data-tentor-nama="${escapeHtml(
                                        tentor.tentor
                                    )}"
                                >
                                    Detail
                                </button>

                            </div>

                        </div>


                        <!-- STATISTIK -->
                        <div class="tentor-stats">

                            <div class="stat-box">

                                <span class="stat-label">
                                    Total KBM
                                </span>

                                <span class="stat-value">
                                    ${tentor.total_kbm}
                                </span>

                            </div>


                            <div class="stat-box">

                                <span class="stat-label">
                                    Jam Efektif
                                </span>

                                <span class="stat-value">
                                    ${tentor.total_mengajar}
                                </span>

                            </div>


                            <div class="stat-box">

                                <span class="stat-label">
                                    Jam Kosong
                                </span>

                                <span class="stat-value">
                                    ${tentor.total_jam_kosong}
                                </span>

                            </div>


                            <div class="stat-box">

                                <span class="stat-label">
                                    Perolehan
                                </span>

                                <span class="stat-value fee">
                                    ${formatRupiah(
                                        tentor.total_fee
                                    )}
                                </span>

                            </div>

                        </div>


                        <!-- DETAIL BIMBINGAN -->
                        <div class="bimbingan-section">

                            <div class="bimbingan-title-row">

                                <h4 class="bimbingan-title">
                                    Detail Bimbingan
                                </h4>

                                <span class="jumlah-jenis">
                                    ${detailRows.length}
                                    jenis
                                </span>

                            </div>


                            <div class="bimbingan-table">

                                <div class="bimbingan-row header">

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


                                ${detailRows
                                    .map(
                                        detail => `
                                            <div class="bimbingan-row">

                                                <div>

                                                    <div class="bimbingan-name">
                                                        ${escapeHtml(
                                                            detail.jenis_bimbingan
                                                        )}
                                                    </div>

                                                    <span class="bimbingan-level">
                                                        ${escapeHtml(
                                                            detail.tingkat || ""
                                                        )}
                                                    </span>

                                                </div>


                                                <div class="bimbingan-number">
                                                    ${detail.total_kbm}
                                                </div>


                                                <div class="bimbingan-number">
                                                    ${detail.total_jam_kosong}
                                                </div>


                                                <div class="bimbingan-number">
                                                    ${detail.total_mengajar}
                                                </div>


                                                <div class="bimbingan-fee">
                                                    ${formatRupiah(
                                                        detail.fee
                                                    )}
                                                </div>

                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>

                    </div>
                `;
            }
        ).join("");


    /*
     * Pasang event tombol Detail
     */

    document
        .querySelectorAll(".detail-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const tentorKode =
                        button.dataset.tentorKode;

                    const tentorNama =
                        button.dataset.tentorNama;

                    openDetail(
                        tentorKode,
                        tentorNama
                    );

                }
            );

        });
}


// =========================================================
// FETCH DETAIL TENTOR
// =========================================================

async function fetchDetailData(
    tentorKode,
    startDate,
    endDate
) {

    console.log(
        "Calling laporan_fee_tentor_detail:",
        tentorKode,
        startDate,
        endDate
    );


    /*
     * Nama parameter mengikuti
     * function Supabase yang kita buat:
     *
     * p_tanggal_awal
     * p_tanggal_akhir
     * p_tentor_kode
     */

    const {
        data,
        error
    } = await supabaseClient.rpc(
        "laporan_fee_tentor_detail",
        {
            p_tanggal_awal:
                startDate,

            p_tanggal_akhir:
                endDate,

            p_tentor_kode:
                tentorKode
        }
    );


    if (error) {
        throw error;
    }


    console.log(
        "Response detail:",
        data
    );


    return Array.isArray(data)
        ? data
        : [];
}


// =========================================================
// OPEN DETAIL
// =========================================================

async function openDetail(
    tentorKode,
    tentorNama
) {

    const startDate =
        tanggalAwalInput.value;

    const endDate =
        tanggalAkhirInput.value;


    modalTitle.textContent =
        `Detail Fee - ${tentorNama}`;


    modalSubtitle.textContent =
        `Kode Tentor: ${tentorKode} • ${formatDate(startDate)} s/d ${formatDate(endDate)}`;


    detailTableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:30px;
                    color:var(--muted);
                "
            >
                Memuat detail...
            </td>
        </tr>
    `;


    detailTotal.textContent =
        formatRupiah(0);


    detailModal.classList.add("show");


    try {

        const rows =
            await fetchDetailData(
                tentorKode,
                startDate,
                endDate
            );


        renderDetailRows(rows);

    } catch (error) {

        console.error(
            "Gagal memuat detail:",
            error
        );


        detailTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:30px;
                        color:var(--danger);
                    "
                >
                    Gagal memuat detail:
                    ${escapeHtml(
                        error?.message ||
                        "Terjadi kesalahan."
                    )}
                </td>
            </tr>
        `;

        detailTotal.textContent =
            formatRupiah(0);
    }
}


// =========================================================
// RENDER DETAIL
// =========================================================

function renderDetailRows(rows) {

    if (!rows.length) {

        detailTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:30px;
                        color:var(--muted);
                    "
                >
                    Tidak ada detail fee pada periode ini.
                </td>
            </tr>
        `;

        detailTotal.textContent =
            formatRupiah(0);

        return;
    }


    let total =
        0;


    detailTableBody.innerHTML =
        rows
            .map(
                (row, index) => {

                    const fee =
                        Number(
                            row.fee || 0
                        );


                    total += fee;


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${formatDate(
                                    row.tanggal
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.jenis_bimbingan ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.kode ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.siswa ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    row.keterangan ||
                                    "-"
                                )}
                            </td>

                            <td class="fee-cell">
                                ${formatRupiah(
                                    fee
                                )}
                            </td>

                            <td>
                                <span class="type-badge">
                                    ${escapeHtml(
                                        row.tipe ||
                                        "fee"
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");


    detailTotal.textContent =
        formatRupiah(total);
}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

    detailModal.classList.remove(
        "show"
    );
}

closeModalButton.addEventListener(
    "click",
    closeModal
);


// Klik area luar modal

detailModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            detailModal
        ) {

            closeModal();

        }

    }
);


// ESC

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            detailModal.classList.contains("show")
        ) {

            closeModal();

        }

    }
);


// =========================================================
// UPDATE PERIODE
// =========================================================

function updatePeriodeLabel(
    startDate,
    endDate
) {

    periodeLabel.textContent =
        `Periode: ${formatDate(startDate)} sampai ${formatDate(endDate)}`;
}


// =========================================================
// LOAD REPORT
// =========================================================

async function loadReport() {

    const startDate =
        tanggalAwalInput.value;

    const endDate =
        tanggalAkhirInput.value;


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

        /*
         * Pastikan user sudah login.
         */

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        if (!sessionData.session) {

            window.location.href =
                "index.html";

            return;
        }


        const rows =
            await fetchReportData(
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


// =========================================================
// FILTER
// =========================================================

filterForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        await loadReport();

    }
);


// =========================================================
// RESET
// =========================================================

resetFilterButton.addEventListener(
    "click",
    async () => {

        setDefaultRange();

        await loadReport();

    }
);


// =========================================================
// START
// =========================================================

setDefaultRange();

loadReport();
