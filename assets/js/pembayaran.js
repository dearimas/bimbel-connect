/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://ipnoshuvofomxwssamma.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   ELEMENT
===================================================== */

const siswaSelect =
    document.getElementById("siswa");

const studentInfo =
    document.getElementById("studentInfo");

const studentMain =
    document.getElementById("studentMain");

const studentMeta =
    document.getElementById("studentMeta");

const tanggalInput =
    document.getElementById("tanggal");

const kodeInput =
    document.getElementById("kode");

const jenisTransaksiSelect =
    document.getElementById("jenis_transaksi");

const saveButton =
    document.getElementById("saveButton");

const messageBox =
    document.getElementById("message");

const cancelButton =
    document.getElementById("cancelButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let currentStaff = null;

let students = [];


/* =====================================================
   FORMAT RUPIAH
===================================================== */

function formatRupiah(value) {

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


function parseCurrencyInput(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const raw =
        String(value).trim();

    if (!raw) {
        return 0;
    }

    const digitsOnly =
        raw.replace(/[^\d]/g, "");

    if (!digitsOnly) {
        return 0;
    }

    const number =
        Number(digitsOnly);

    return Number.isFinite(number)
        ? number
        : 0;

}


function formatCurrencyInput(value) {

    const parsed =
        parseCurrencyInput(value);

    if (!Number.isFinite(parsed)) {
        return "";
    }

    return new Intl.NumberFormat(
        "id-ID",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ).format(parsed);

}


function bindCurrencyInput(id) {

    const input =
        document.getElementById(id);

    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            const rawValue =
                this.value;


            if (
                !rawValue ||
                rawValue.trim() === ""
            ) {

                this.value =
                    id === "non_tunai_nominal"
                        ? "0"
                        : "";


                if (
                    id === "non_tunai_nominal"
                ) {

                    if (
                        !document
                            .getElementById(
                                "non_tunai_tipe"
                            )
                            .value
                    ) {

                        document
                            .getElementById(
                                "non_tunai_keterangan"
                            )
                            .value = "";

                    }

                    updateUangKembali();

                }

                return;

            }


            const numericValue =
                parseCurrencyInput(
                    rawValue
                );


            this.value =
                formatCurrencyInput(
                    numericValue
                );


            if (
                id === "total_bayar" ||
                id === "tunai_baru" ||
                id === "non_tunai_nominal"
            ) {

                updateUangKembali();

            }

        }
    );


    input.addEventListener(
        "blur",
        function () {

            const current =
                this.value;


            if (
                !current ||
                current.trim() === ""
            ) {

                this.value =
                    id === "non_tunai_nominal"
                        ? "0"
                        : "";

            } else {

                this.value =
                    formatCurrencyInput(
                        current
                    );

            }


            if (
                id === "total_bayar" ||
                id === "tunai_baru" ||
                id === "non_tunai_nominal"
            ) {

                updateUangKembali();

            }

        }
    );

}


/* =====================================================
   UANG KEMBALI
===================================================== */

function updateUangKembali() {

    const totalBayar =
        parseCurrencyInput(
            document.getElementById(
                "total_bayar"
            ).value
        );


    const tunai =
        parseCurrencyInput(
            document.getElementById(
                "tunai_baru"
            ).value
        );


    const nonTunai =
        parseCurrencyInput(
            document.getElementById(
                "non_tunai_nominal"
            ).value
        );


    const kembalian =
        Math.max(
            0,
            (tunai + nonTunai) - totalBayar
        );


    const uangKembaliInput =
        document.getElementById(
            "uang_kembali"
        );


    uangKembaliInput.value =
        formatCurrencyInput(
            kembalian
        );

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "success"
) {

    messageBox.textContent =
        text;

    messageBox.className =
        "message show " + type;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   FORMAT TANGGAL INDONESIA
===================================================== */

/*
 * Tampilan:
 *
 * DD/MM/YYYY
 *
 * Contoh:
 * 17/08/2026
 */

function formatTanggalIndonesia(
    date = new Date()
) {

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;

}


/*
 * Konversi:
 *
 * 17/08/2026
 *
 * menjadi:
 *
 * 2026-08-17
 *
 * untuk Supabase.
 */

function parseTanggalIndonesia(
    value
) {

    if (
        !value ||
        typeof value !== "string"
    ) {

        return null;

    }


    const trimmed =
        value.trim();


    const match =
        trimmed.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (!match) {

        return null;

    }


    const day =
        Number(match[1]);


    const month =
        Number(match[2]);


    const year =
        Number(match[3]);


    /*
     * Validasi bulan
     */

    if (
        month < 1 ||
        month > 12
    ) {

        return null;

    }


    /*
     * Validasi hari
     */

    if (
        day < 1 ||
        day > 31
    ) {

        return null;

    }


    /*
     * Buat Date
     */

    const date =
        new Date(
            year,
            month - 1,
            day
        );


    /*
     * Pastikan tanggal benar-benar valid.
     *
     * Contoh:
     * 31/02/2026
     * harus ditolak.
     */

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {

        return null;

    }


    return (
        `${year}-` +
        `${String(month).padStart(2, "0")}-` +
        `${String(day).padStart(2, "0")}`
    );

}


/*
 * Set tanggal default.
 *
 * Saat halaman pertama dibuka:
 *
 * 17/08/2026
 */

function setDefaultDate() {

    if (!tanggalInput) {
        return;
    }


    tanggalInput.value =
        formatTanggalIndonesia();

}


/*
 * Format input tanggal saat diketik.
 *
 * 17082026
 *
 * otomatis menjadi:
 *
 * 17/08/2026
 */

function bindTanggalInput() {

    if (!tanggalInput) {
        return;
    }


    tanggalInput.addEventListener(
        "input",
        function () {

            let value =
                this.value.replace(
                    /\D/g,
                    ""
                );


            /*
             * Maksimal 8 digit:
             *
             * DDMMYYYY
             */

            if (
                value.length > 8
            ) {

                value =
                    value.substring(
                        0,
                        8
                    );

            }


            if (
                value.length >= 5
            ) {

                value =
                    value.substring(0, 2) +
                    "/" +
                    value.substring(2, 4) +
                    "/" +
                    value.substring(4);

            } else if (
                value.length >= 3
            ) {

                value =
                    value.substring(0, 2) +
                    "/" +
                    value.substring(2);

            }


            this.value =
                value;

        }
    );


    /*
     * Validasi saat meninggalkan input
     */

    tanggalInput.addEventListener(
        "blur",
        function () {

            if (!this.value.trim()) {

                return;

            }


            const parsed =
                parseTanggalIndonesia(
                    this.value
                );


            if (!parsed) {

                this.classList.add(
                    "invalid"
                );

            } else {

                this.classList.remove(
                    "invalid"
                );

            }

        }
    );

}


/* =====================================================
   GENERATE KODE
===================================================== */

function generatePaymentCode() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return (
        `BYR-${year}${month}${day}-${random}`
    );

}


/* =====================================================
   CEK LOGIN
===================================================== */

async function checkLogin() {

    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Gagal memeriksa sesi:",
            error
        );

        throw error;

    }


    if (!session) {

        window.location.href =
            "index.html";

        return false;

    }


    currentUser =
        session.user;


    return true;

}


/* =====================================================
   LOAD STAFF
===================================================== */

async function loadStaff() {

    const email =
        currentUser.email;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("staff")
            .select(
                "kode, nama, email"
            )
            .eq(
                "email",
                email
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Staff error:",
            error
        );

        return null;

    }


    currentStaff =
        data;


    return data;

}


/* =====================================================
   LOAD SISWA + KELAS
===================================================== */

async function loadStudents() {

    siswaSelect.innerHTML =
        `
        <option value="">
            Memuat daftar siswa...
        </option>
        `;


    /*
     * Ambil master siswa
     */

    const {
        data: siswaData,
        error: siswaError
    } =
        await supabaseClient
            .from("master_siswa")
            .select(
                "kode, nama, kelas_kode"
            )
            .order(
                "nama",
                {
                    ascending: true
                }
            );


    if (siswaError) {

        console.error(
            "Master siswa gagal dimuat:",
            {
                code:
                    siswaError.code,

                message:
                    siswaError.message,

                details:
                    siswaError.details,

                hint:
                    siswaError.hint
            }
        );

        throw siswaError;

    }


    /*
     * Ambil master kelas
     */

    const {
        data: kelasData,
        error: kelasError
    } =
        await supabaseClient
            .from("master_kelas")
            .select(
                "kode, nama, tingkat"
            )
            .order(
                "tingkat",
                {
                    ascending: true
                }
            );


    if (kelasError) {

        console.error(
            "Master kelas gagal dimuat:",
            {
                code:
                    kelasError.code,

                message:
                    kelasError.message,

                details:
                    kelasError.details,

                hint:
                    kelasError.hint
            }
        );

        throw kelasError;

    }


    /*
     * Buat map kelas
     */

    const kelasMap =
        new Map();


    kelasData.forEach(
        kelas => {

            kelasMap.set(
                kelas.kode,
                kelas
            );

        }
    );


    /*
     * Gabungkan siswa + kelas
     */

    students =
        siswaData.map(
            siswa => {

                const kelas =
                    kelasMap.get(
                        siswa.kelas_kode
                    );


                return {

                    kode:
                        siswa.kode,

                    nama:
                        siswa.nama,

                    kelasKode:
                        siswa.kelas_kode,

                    kelasNama:
                        kelas
                            ? kelas.nama
                            : "-",

                    tingkat:
                        kelas
                            ? kelas.tingkat
                            : "-"

                };

            }
        );


    /*
     * Isi dropdown
     */

    siswaSelect.innerHTML =
        `
        <option value="">
            Pilih siswa...
        </option>
        `;


    students.forEach(
        siswa => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                siswa.kode;


            option.textContent =
                `${siswa.kode} — ${siswa.nama} · ${siswa.kelasNama} · Tingkat ${siswa.tingkat}`;


            siswaSelect.appendChild(
                option
            );

        }
    );

}


/* =====================================================
   SISWA DIPILIH
===================================================== */

siswaSelect.addEventListener(
    "change",
    function () {

        const kode =
            this.value;


        const siswa =
            students.find(
                item =>
                    item.kode === kode
            );


        if (!siswa) {

            studentMain.textContent =
                "";

            studentMeta.textContent =
                "";

            studentInfo.classList.remove(
                "show"
            );

            return;

        }


        studentMain.textContent =
            `${siswa.kode} — ${siswa.nama}`;


        studentMeta.textContent =
            `Kelas ${siswa.kelasNama} · Tingkat ${siswa.tingkat}`;


        studentInfo.classList.add(
            "show"
        );

    }
);


/* =====================================================
   VALIDASI NOMINAL
===================================================== */

function getAmount(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return 0;

    }


    const value =
        element.value;


    const amount =
        parseCurrencyInput(
            value
        );


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        throw new Error(
            "Nominal pembayaran tidak boleh negatif."
        );

    }


    return amount;

}


/* =====================================================
   NON TUNAI
===================================================== */

function updateNonCashReference() {

    const type =
        document.getElementById(
            "non_tunai_tipe"
        ).value;


    const label =
        document.getElementById(
            "nonTunaiKeteranganLabel"
        );


    const input =
        document.getElementById(
            "non_tunai_keterangan"
        );


    const nominalInput =
        document.getElementById(
            "non_tunai_nominal"
        );


    const details = {

        transfer: {

            label:
                "Bank Transfer",

            placeholder:
                "Contoh: BCA / BRI / Mandiri"

        },

        qris: {

            label:
                "Bank / Penyedia QRIS",

            placeholder:
                "Contoh: BCA / GoPay / DANA"

        },

        voucher: {

            label:
                "Nomor Voucher",

            placeholder:
                "Masukkan nomor atau keterangan voucher"

        }

    };


    const detail =
        details[type] ||
        {

            label:
                "Bank / Nomor Voucher",

            placeholder:
                "Pilih metode non tunai terlebih dahulu"

        };


    label.textContent =
        detail.label;


    input.placeholder =
        detail.placeholder;


    if (!type) {

        nominalInput.disabled =
            true;

        nominalInput.value =
            "0";


        input.disabled =
            true;

        input.value =
            "";

    } else {

        nominalInput.disabled =
            false;

        input.disabled =
            false;

    }


    updateUangKembali();

}


function getNonCashValues() {

    const type =
        document.getElementById(
            "non_tunai_tipe"
        ).value;


    const nominal =
        getAmount(
            "non_tunai_nominal"
        );


    const detail =
        document.getElementById(
            "non_tunai_keterangan"
        )
            .value
            .trim() || null;


    if (
        nominal > 0 &&
        !type
    ) {

        throw new Error(
            "Pilih metode untuk pembayaran non tunai."
        );

    }


    if (
        type &&
        nominal <= 0
    ) {

        throw new Error(
            "Masukkan nominal pembayaran non tunai."
        );

    }


    return {

        type,

        nominal,

        detail

    };

}


/* =====================================================
   PAYMENT INPUT LISTENER
===================================================== */

const nonTunaiTipe =
    document.getElementById(
        "non_tunai_tipe"
    );


if (nonTunaiTipe) {

    nonTunaiTipe.addEventListener(
        "change",
        function () {

            updateNonCashReference();


            if (!this.value) {

                document.getElementById(
                    "non_tunai_nominal"
                ).value =
                    "0";


                document.getElementById(
                    "non_tunai_keterangan"
                ).value =
                    "";

            }

        }
    );

}


/* =====================================================
   JENIS TRANSAKSI
===================================================== */

function updateJenisTransaksiState() {

    const isPendaftaran =
        jenisTransaksiSelect.value === "DFT";


    /*
     * Pendaftaran tidak wajib memilih siswa.
     * Bahkan siswa dinonaktifkan untuk DFT.
     */

    siswaSelect.disabled =
        isPendaftaran;


    if (isPendaftaran) {

        siswaSelect.value =
            "";

        studentMain.textContent =
            "";

        studentMeta.textContent =
            "";

        studentInfo.classList.remove(
            "show"
        );

    }

}


/*
 * Event jenis transaksi
 */

if (jenisTransaksiSelect) {

    jenisTransaksiSelect.addEventListener(
        "change",
        function () {

            updateJenisTransaksiState();

        }
    );

}


/* =====================================================
   SIMPAN PEMBAYARAN
===================================================== */

async function savePayment() {

    messageBox.className =
        "message";


    /*
     * Ambil siswa.
     *
     * BOLEH KOSONG.
     */

    const siswa =
        siswaSelect.value || null;


    /*
     * Ambil tanggal tampilan:
     *
     * DD/MM/YYYY
     */

    const tanggal =
        tanggalInput.value.trim();


    /*
     * Konversi menjadi:
     *
     * YYYY-MM-DD
     */

    const tanggalIso =
        parseTanggalIndonesia(
            tanggal
        );


    const jenisTransaksi =
        jenisTransaksiSelect.value;


    /*
     * Validasi tanggal
     */

    if (!tanggalIso) {

        showMessage(
            "Tanggal pembayaran tidak valid. Gunakan format DD/MM/YYYY.",
            "error"
        );


        tanggalInput.focus();

        return;

    }


    /*
     * Siswa TIDAK wajib.
     *
     * Jadi tidak ada validasi:
     *
     * if (!siswa)
     *
     */


    /*
     * Jenis transaksi
     */

    if (!jenisTransaksi) {

        showMessage(
            "Silakan pilih jenis transaksi.",
            "error"
        );


        jenisTransaksiSelect.focus();

        return;

    }


    /*
     * Total pembayaran
     */

    const total =
        parseCurrencyInput(
            document.getElementById(
                "total_bayar"
            ).value
        ) || 0;


    if (total <= 0) {

        showMessage(
            "Total bayar wajib diisi.",
            "error"
        );

        document
            .getElementById(
                "total_bayar"
            )
            .focus();

        return;

    }


    /*
     * Disable tombol
     */

    saveButton.disabled =
        true;


    saveButton.textContent =
        "⏳ Menyimpan...";


    try {

        /*
         * Pastikan staff sudah diketahui
         */

        if (!currentStaff) {

            await loadStaff();

        }


        if (
            !currentStaff ||
            !currentStaff.kode
        ) {

            throw new Error(
                "Profil staff tidak ditemukan. Pembayaran tidak dapat disimpan."
            );

        }


        const createdBy =
            currentStaff.kode;


        /*
         * Ambil pembayaran non tunai
         */

        const nonCash =
            getNonCashValues();


        /*
         * Data pembayaran
         */

        const paymentData = {

            tanggal:
                tanggalIso,

            siswa:
                siswa,

            total_bayar:
                getAmount(
                    "total_bayar"
                ),

            tunai:
                getAmount(
                    "tunai_baru"
                ),

            uang_kembali:
                getAmount(
                    "uang_kembali"
                ),

            transfer:
                nonCash.type === "transfer"
                    ? nonCash.nominal
                    : 0,

            transfer_bank:
                nonCash.type === "transfer"
                    ? nonCash.detail
                    : null,

            qris:
                nonCash.type === "qris"
                    ? nonCash.nominal
                    : 0,

            voucher:
                nonCash.type === "voucher"
                    ? nonCash.nominal
                    : 0,

            voucher_keterangan:
                nonCash.type === "voucher"
                    ? nonCash.detail
                    : null,

            catatan:
                document.getElementById(
                    "catatan"
                )
                    .value
                    .trim() || null,

            batal:
                false,

            created_by:
                createdBy,

            updated_by:
                createdBy

        };


        console.log(
            "Data pembayaran:",
            paymentData
        );


        /*
         * Simpan melalui RPC Supabase
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "simpan_pembayaran",
                    {

                        p_jenis_transaksi:
                            jenisTransaksi,

                        p_tanggal:
                            paymentData.tanggal,

                        p_siswa:
                            paymentData.siswa,

                        p_total_bayar:
                            paymentData.total_bayar,

                        p_tunai:
                            paymentData.tunai,

                        p_uang_kembali:
                            paymentData.uang_kembali,

                        p_transfer:
                            paymentData.transfer,

                        p_transfer_bank:
                            paymentData.transfer_bank,

                        p_qris:
                            paymentData.qris,

                        p_voucher:
                            paymentData.voucher,

                        p_voucher_keterangan:
                            paymentData.voucher_keterangan,

                        p_catatan:
                            paymentData.catatan

                    }
                );


        if (error) {

            console.error(
                "Gagal menyimpan:",
                error
            );

            throw error;

        }


        /*
         * Ambil kode hasil RPC
         */

        const savedCode =
            Array.isArray(data)
                ? data[0]?.kode
                : data?.kode;


        kodeInput.value =
            savedCode || "";


        showMessage(
            `Pembayaran berhasil disimpan. Kode: ${savedCode || "tidak tersedia"}`,
            "success"
        );


        /*
         * Reset form
         */

        resetForm();


    } catch (error) {

        console.error(
            "Gagal menyimpan pembayaran:",
            error
        );


        showMessage(
            "Gagal menyimpan pembayaran: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            "error"
        );


    } finally {

        saveButton.disabled =
            false;


        saveButton.textContent =
            "💾 Simpan Pembayaran";

    }

}


/* =====================================================
   RESET FORM
===================================================== */

function resetForm() {

    /*
     * Siswa
     */

    siswaSelect.value =
        "";


    studentMain.textContent =
        "";


    studentMeta.textContent =
        "";


    studentInfo.classList.remove(
        "show"
    );


    /*
     * Total
     */

    document.getElementById(
        "total_bayar"
    ).value =
        "";


    /*
     * Tunai
     */

    document.getElementById(
        "tunai_baru"
    ).value =
        "";


    /*
     * Non tunai
     */

    document.getElementById(
        "non_tunai_tipe"
    ).value =
        "";


    document.getElementById(
        "non_tunai_nominal"
    ).value =
        "0";


    document.getElementById(
        "non_tunai_keterangan"
    ).value =
        "";


    /*
     * Jenis transaksi
     */

    jenisTransaksiSelect.value =
        "";


    /*
     * Legacy payment fields
     */

    document.getElementById(
        "tunai"
    ).value =
        "";


    document.getElementById(
        "transfer"
    ).value =
        "";


    document.getElementById(
        "qris"
    ).value =
        "";


    document.getElementById(
        "voucher"
    ).value =
        "";


    /*
     * Detail
     */

    document.getElementById(
        "transfer_bank"
    ).value =
        "";


    document.getElementById(
        "voucher_keterangan"
    ).value =
        "";


    /*
     * Uang kembali
     */

    document.getElementById(
        "uang_kembali"
    ).value =
        "0";


    /*
     * Catatan
     */

    document.getElementById(
        "catatan"
    ).value =
        "";


    /*
     * Kode pembayaran
     */

    kodeInput.value =
        "";


    /*
     * Kembalikan tanggal
     * ke hari ini
     */

    setDefaultDate();


    /*
     * Update state
     */

    updateJenisTransaksiState();

    updateNonCashReference();

    updateUangKembali();

}


/* =====================================================
   CANCEL
===================================================== */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

        }
    );

}


/* =====================================================
   SAVE BUTTON
===================================================== */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        savePayment
    );

}


/* =====================================================
   INIT
===================================================== */

async function init() {

    try {

        /*
         * Set tanggal hari ini
         * SEBELUM proses lainnya.
         */

        setDefaultDate();


        /*
         * Aktifkan formatter tanggal
         */

        bindTanggalInput();


        /*
         * Cek login
         */

        const loggedIn =
            await checkLogin();


        if (!loggedIn) {

            return;

        }


        /*
         * Currency input
         */

        bindCurrencyInput(
            "total_bayar"
        );

        bindCurrencyInput(
            "tunai_baru"
        );

        bindCurrencyInput(
            "non_tunai_nominal"
        );


        /*
         * Uang kembali
         */

        const uangKembaliInput =
            document.getElementById(
                "uang_kembali"
            );


        uangKembaliInput.readOnly =
            true;


        uangKembaliInput.value =
            "0";


        /*
         * Initial non tunai
         */

        document.getElementById(
            "non_tunai_tipe"
        ).value =
            "";


        document.getElementById(
            "non_tunai_nominal"
        ).value =
            "0";


        document.getElementById(
            "non_tunai_keterangan"
        ).value =
            "";


        document.getElementById(
            "non_tunai_nominal"
        ).disabled =
            true;


        document.getElementById(
            "non_tunai_keterangan"
        ).disabled =
            true;


        /*
         * Update state
         */

        updateJenisTransaksiState();

        updateNonCashReference();


        /*
         * Load staff
         */

        const staff =
            await loadStaff();


        if (
            !staff ||
            !staff.kode
        ) {

            saveButton.disabled =
                true;


            showMessage(
                "Profil staff tidak ditemukan. Pembayaran belum dapat disimpan.",
                "error"
            );

        }


        /*
         * Load siswa
         */

        await loadStudents();


    } catch (error) {

        console.error(
            "INIT ERROR:",
            error
        );


        siswaSelect.innerHTML =
            `
            <option value="">
                Gagal memuat data siswa
            </option>
            `;


        showMessage(
            `Gagal memuat data siswa (${error.code || "tanpa kode"}). Periksa Console untuk detailnya.`,
            "error"
        );

    }

}


/* =====================================================
   START APPLICATION
===================================================== */

init();