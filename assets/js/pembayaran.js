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
           DEFAULT DATE
        ===================================================== */

        function setDefaultDate() {

            const today =
                new Date();

            const year =
                today.getFullYear();

            const month =
                String(
                    today.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    today.getDate()
                ).padStart(2, "0");

            tanggalInput.value =
                `${year}-${month}-${day}`;

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
                ).padStart(2, "0");

            const day =
                String(
                    now.getDate()
                ).padStart(2, "0");

            const random =
                Math.floor(
                    1000 +
                    Math.random() * 9000
                );

            return `BYR-${year}${month}${day}-${random}`;

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
                await supabaseClient.auth.getSession();


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
                `<option value="">
            Memuat daftar siswa...
        </option>`;


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
                        "kode, nama, kelas"
                    )
                    .order(
                        "nama",
                        {
                            ascending: true
                        }
                    );


            if (siswaError) {

                console.error(
                    "Master siswa:",
                    siswaError
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
                    "Master kelas:",
                    kelasError
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
                                siswa.kelas
                            );


                        return {

                            kode:
                                siswa.kode,

                            nama:
                                siswa.nama,

                            kelasKode:
                                siswa.kelas,

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
                `<option value="">
            Pilih siswa...
        </option>`;


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

            const value =
                document.getElementById(id).value;

            const amount =
                Number(value || 0);


            if (!Number.isFinite(amount) || amount < 0) {

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
                document.getElementById("non_tunai_tipe").value;

            const label =
                document.getElementById("nonTunaiKeteranganLabel");

            const input =
                document.getElementById("non_tunai_keterangan");

            const details = {
                transfer: {
                    label: "Bank Transfer",
                    placeholder: "Contoh: BCA / BRI / Mandiri"
                },
                qris: {
                    label: "Bank / Penyedia QRIS",
                    placeholder: "Contoh: BCA / GoPay / DANA"
                },
                voucher: {
                    label: "Nomor Voucher",
                    placeholder: "Masukkan nomor atau keterangan voucher"
                }
            };

            const detail =
                details[type] || {
                    label: "Bank / Nomor Voucher",
                    placeholder: "Pilih metode non tunai terlebih dahulu"
                };

            label.textContent =
                detail.label;

            input.placeholder =
                detail.placeholder;

        }


        function getNonCashValues() {

            const type =
                document.getElementById("non_tunai_tipe").value;

            const nominal =
                getAmount("non_tunai_nominal");

            const detail =
                document.getElementById("non_tunai_keterangan")
                    .value
                    .trim() || null;


            if (nominal > 0 && !type) {

                throw new Error(
                    "Pilih metode untuk pembayaran non tunai."
                );

            }


            if (type && nominal <= 0) {

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

        document
            .getElementById("non_tunai_tipe")
            .addEventListener(
                "change",
                updateNonCashReference
            );



        /* =====================================================
           SIMPAN PEMBAYARAN
        ===================================================== */

        async function savePayment() {

            messageBox.className =
                "message";


            const siswa =
                siswaSelect.value;


            const tanggal =
                tanggalInput.value;

            const jenisTransaksi =
                jenisTransaksiSelect.value;


            if (!siswa) {

                showMessage(
                    "Silakan pilih siswa terlebih dahulu.",
                    "error"
                );

                siswaSelect.focus();

                return;

            }


            if (!tanggal) {

                showMessage(
                    "Tanggal pembayaran wajib diisi.",
                    "error"
                );

                tanggalInput.focus();

                return;

            }


            if (!jenisTransaksi) {

                showMessage(
                    "Silakan pilih jenis transaksi.",
                    "error"
                );

                jenisTransaksiSelect.focus();

                return;

            }


            const total =
                Number(
                    document.getElementById("total_bayar").value
                ) || 0;


            if (total <= 0) {

                showMessage(
                    "Total bayar wajib diisi.",
                    "error"
                );

                return;

            }


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


                if (!currentStaff || !currentStaff.kode) {

                    throw new Error(
                        "Profil staff tidak ditemukan. Pembayaran tidak dapat disimpan."
                    );

                }


                const createdBy =
                    currentStaff.kode;

                const nonCash =
                    getNonCashValues();


                /*
                 * Ambil nilai form
                 */

                const paymentData = {

                    tanggal:
                        tanggal,

                    siswa:
                        siswa,

                    total_bayar:
                        getAmount("total_bayar"),

                    tunai:
                        getAmount("tunai_baru"),

                    uang_kembali:
                        getAmount("uang_kembali"),

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
                        ).value
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


                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .rpc(
                            "simpan_pembayaran",
                            {
                                p_jenis_transaksi: jenisTransaksi,
                                p_tanggal: paymentData.tanggal,
                                p_siswa: paymentData.siswa,
                                p_total_bayar: paymentData.total_bayar,
                                p_tunai: paymentData.tunai,
                                p_uang_kembali: paymentData.uang_kembali,
                                p_transfer: paymentData.transfer,
                                p_transfer_bank: paymentData.transfer_bank,
                                p_qris: paymentData.qris,
                                p_voucher: paymentData.voucher,
                                p_voucher_keterangan: paymentData.voucher_keterangan,
                                p_catatan: paymentData.catatan
                            }
                        );


                if (error) {

                    console.error(
                        "Gagal menyimpan:",
                        error
                    );

                    throw error;

                }


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
                    error
                );


                showMessage(
                    "Gagal menyimpan pembayaran: " +
                    error.message,
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

            siswaSelect.value =
                "";

            studentInfo.classList.remove(
                "show"
            );


            document.getElementById(
                "total_bayar"
            ).value =
                "";


            document.getElementById(
                "tunai_baru"
            ).value =
                "";


            document.getElementById(
                "non_tunai_tipe"
            ).value =
                "";


            document.getElementById(
                "non_tunai_nominal"
            ).value =
                "";


            document.getElementById(
                "non_tunai_keterangan"
            ).value =
                "";


            jenisTransaksiSelect.value =
                "";


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


            document.getElementById(
                "transfer_bank"
            ).value =
                "";


            document.getElementById(
                "voucher_keterangan"
            ).value =
                "";


            document.getElementById(
                "uang_kembali"
            ).value =
                "";


            document.getElementById(
                "catatan"
            ).value =
                "";


            updateNonCashReference();


            setDefaultDate();

        }



        /* =====================================================
           CANCEL
        ===================================================== */

        document
            .getElementById(
                "cancelButton"
            )
            .addEventListener(
                "click",
                function () {

                    window.location.href =
                    "./";

                }
            );



        /* =====================================================
           SAVE
        ===================================================== */

        saveButton.addEventListener(
            "click",
            savePayment
        );



        /* =====================================================
           INIT
        ===================================================== */

        async function init() {

            try {

                const loggedIn =
                    await checkLogin();


                if (!loggedIn) {

                    return;

                }


                setDefaultDate();


                updateNonCashReference();


                const staff =
                    await loadStaff();


                if (!staff || !staff.kode) {

                    saveButton.disabled =
                        true;

                    showMessage(
                        "Profil staff tidak ditemukan. Pembayaran belum dapat disimpan.",
                        "error"
                    );

                }


                await loadStudents();


            } catch (error) {

                console.error(
                    "INIT ERROR:",
                    error
                );


                siswaSelect.innerHTML =
                    `<option value="">
                Gagal memuat data siswa
            </option>`;


                showMessage(
                    "Gagal memuat data. Periksa koneksi Supabase dan RLS.",
                    "error"
                );

            }

        }


        init();
