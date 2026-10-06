const SUPABASE_URL =
    "https://ipnoshuvofomxwssamma.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


const lookupForm =
    document.getElementById("lookupForm");

const tokenInput =
    document.getElementById("token");

const lookupButton =
    document.getElementById("lookupButton");

const buttonText =
    document.getElementById("buttonText");

const buttonLoading =
    document.getElementById("buttonLoading");

const errorMessage =
    document.getElementById("errorMessage");

const reportSection =
    document.getElementById("reportSection");

const tentorName =
    document.getElementById("tentorName");

const periodeLabel =
    document.getElementById("periodeLabel");

const totalFee =
    document.getElementById("totalFee");

const totalData =
    document.getElementById("totalData");

const totalKbm =
    document.getElementById("totalKbm");

const totalBonus =
    document.getElementById("totalBonus");

const reportBody =
    document.getElementById("reportBody");

const lastDataAt =
    document.getElementById("lastDataAt");


/* =====================================================
   FORMAT
===================================================== */

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
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


/* =====================================================
   UI
===================================================== */

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function clearError() {

    errorMessage.textContent = "";

    errorMessage.classList.add(
        "hidden"
    );
}


function setLoading(loading) {

    lookupButton.disabled =
        loading;

    if (loading) {

        buttonText.classList.add(
            "hidden"
        );

        buttonLoading.classList.remove(
            "hidden"
        );

    } else {

        buttonText.classList.remove(
            "hidden"
        );

        buttonLoading.classList.add(
            "hidden"
        );
    }
}

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
            month: "long", 
            year: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit", 
            timeZone: "Asia/Jakarta",
            timeZoneName: "short" 
        } 
    ).format(date); 
}

/* =====================================================
   LOAD REPORT
===================================================== */

async function loadReport(token) {

    clearError();

    reportSection.classList.add(
        "hidden"
    );

    setLoading(true);

    try {

        console.log(
            "Memanggil cek_laporan_fee_public"
        );


        const [ 
            reportResult, lastUpdateResult 
        ] = await Promise.all([ 
            
            supabaseClient.rpc( 
                "cek_laporan_fee_public", 
                { 
                    p_token: token.trim() 
                } 
            ), 
            
            supabaseClient.rpc( 
                "cek_laporan_fee_last_update", 
                {
                    p_token: token.trim() 
                } 
            ) 
        ]);

        const { 
            data, error 
        } = reportResult; 
        
        const { 
            data: lastData, error: lastUpdateError 
        } = lastUpdateResult;


        if (error) {
            throw error;
        }

        if (lastUpdateError) { 
            throw lastUpdateError; 
        }

        console.log(
            "Response:",
            data
        );

        console.log( 
            "Last data:", 
            lastData 
        );

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            throw new Error(
                "Laporan tidak ditemukan atau belum memiliki data."
            );
        }


        renderReport(data, lastData);


    } catch (error) {

        console.error(
            "Gagal memuat laporan:",
            error
        );

        showError(
            error?.message ||
            "Gagal memuat laporan."
        );

    } finally {

        setLoading(false);
    }
}


/* =====================================================
   RENDER
===================================================== */

function renderReport(rows, lastData) {

    const first =
        rows[0];


    tentorName.textContent =
        first.tentor || "-";


    periodeLabel.textContent =
        `Periode: ${formatDate(
            first.tanggal_awal
        )} sampai ${formatDate(
            first.tanggal_akhir
        )}`;

    if (lastDataAt) { 
        lastDataAt.textContent =
            lastData 
            ? `Last update data : ${formatDateTime(lastData)}`
            : "Last update data : -"; 
    }


    const total =
        rows.reduce(
            (sum, row) =>
                sum +
                Number(row.fee || 0),
            0
        );


    const kbmRows =
        rows.filter(
            row =>
                row.tipe === "fee"
        );


    const bonusRows =
        rows.filter(
            row =>
                row.tipe === "bonus"
        );


    totalFee.textContent =
        formatRupiah(total);


    totalData.textContent =
        rows.length;


    totalKbm.textContent =
        kbmRows.length;


    totalBonus.textContent =
        bonusRows.length;


    reportBody.innerHTML =
        rows.map(
            (row, index) => {

                const badgeClass =
                    row.tipe === "bonus"
                        ? "type-badge bonus"
                        : "type-badge";


                const siswa =
                    row.siswa || "-";


                const keterangan =
                    row.keterangan || "-";

                const materi =
                    row.materi || "-";


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
                                row.jenis_bimbingan
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                row.kode
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                siswa
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                keterangan
                            )}
                        </td>

                        <td class="fee">
                            ${formatRupiah(
                                row.fee
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                materi
                            )}
                        </td>
                    </tr>

                `;
            }
        ).join("");


    reportSection.classList.remove(
        "hidden"
    );


    reportSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   FORM
===================================================== */

lookupForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const token =
            tokenInput.value
                .trim()
                .toUpperCase();


        if (!token) {

            showError(
                "Silakan masukkan token laporan."
            );

            return;
        }


        await loadReport(token);
    }
);


/* =====================================================
   AUTO FORMAT TOKEN
===================================================== */

tokenInput.addEventListener(
    "input",
    () => {

        tokenInput.value =
            tokenInput.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 32);
    }
);
