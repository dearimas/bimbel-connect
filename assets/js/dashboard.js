/* =========================
           SUPABASE
        ========================== */

        const SUPABASE_URL =
            "https://ipnoshuvofomxwssamma.supabase.co";

        const SUPABASE_KEY =
            "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

        const supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        /* =========================
           LOAD USER + STAFF
        ========================== */

        async function loadLegacyStaffProfile() {

            const {
                data: {
                    session
                }
            } =
                await supabaseClient.auth.getSession();


            // Tidak login
            if (!session) {

                window.location.href =
                    "index.html";

                return;
            }


            const user =
                session.user;

            const email =
                user.email;


            /*
             * Ambil data staff berdasarkan email
             *
             * Struktur tabel:
             *
             * staff
             * ├── kode
             * ├── nama
             * ├── email
             * └── ...
             */

            const {
                data: staff,
                error
            } =
                await supabaseClient
                    .from("staff")
                    .select("kode, nama, email")
                    .eq("email", email)
                    .maybeSingle();

            console.log("EMAIL LOGIN:", email);
            console.log("DATA STAFF:", staff);
            console.log("ERROR STAFF:", error);

            if (error) {
                document.getElementById("staffName").textContent = "ERROR";
                document.getElementById("staffDetail").textContent = error.message;
                return;
            }

            if (!staff) {
                document.getElementById("staffName").textContent = "STAFF TIDAK DITEMUKAN";
                document.getElementById("staffDetail").textContent = email;
                return;
            }

            document.getElementById("staffName").textContent = staff.nama;
            document.getElementById("staffDetail").textContent =
                `${staff.kode} · ${staff.email}`;

            if (error) {

                console.error(
                    "Gagal mengambil data staff:",
                    error
                );

                document
                    .getElementById("staffName")
                    .textContent =
                    staff.nama || "Staff";

                document
                    .getElementById("staffDetail")
                    .textContent =
                    `${staff.kode || "-"} · ${staff.email || email}`;

                return;
            }


            if (!staff) {

                document
                    .getElementById("staffName")
                    .textContent =
                    "User";

                document
                    .getElementById("staffDetail")
                    .textContent =
                    email;

                console.warn(
                    "Data staff tidak ditemukan untuk:",
                    email
                );

                return;
            }


            // Tampilkan nama
            document
                .getElementById("staffName")
                .textContent =
                staff.nama || "User";


            // Tampilkan kode - email
            document
                .getElementById("staffDetail")
                .textContent =
                `${staff.kode || "-"} · ${staff.email || email}`;

        }


        async function loadStaffProfile() {

            try {

                const {
                    data: {
                        session
                    },
                    error: sessionError
                } =
                    await supabaseClient.auth.getSession();


                if (sessionError) {

                    throw sessionError;

                }


                if (!session) {

                    window.location.href =
                        "index.html";

                    return;

                }


                const email =
                    session.user.email;

                const {
                    data: staff,
                    error
                } =
                    await supabaseClient
                        .from("staff")
                        .select("kode, nama, email")
                        .eq("email", email)
                        .maybeSingle();


                if (error) {

                    console.error(
                        "Gagal mengambil data staff:",
                        error
                    );

                    document.getElementById("staffName").textContent =
                        "Profil staff tidak dapat dimuat";

                    document.getElementById("staffDetail").textContent =
                        email;

                    return;

                }


                if (!staff) {

                    console.warn(
                        "Data staff tidak ditemukan untuk:",
                        email
                    );

                    document.getElementById("staffName").textContent =
                        "Staff tidak ditemukan";

                    document.getElementById("staffDetail").textContent =
                        email;

                    return;

                }


                document.getElementById("staffName").textContent =
                    staff.nama;

                document.getElementById("staffDetail").textContent =
                    `${staff.kode} · ${staff.email}`;

            } catch (error) {

                console.error(
                    "Gagal memeriksa sesi atau memuat staff:",
                    error
                );

                document.getElementById("staffName").textContent =
                    "Profil tidak dapat dimuat";

                document.getElementById("staffDetail").textContent =
                    "Silakan muat ulang halaman.";

            }

        }


        /* =========================
           LOGOUT
        ========================== */

        async function logout() {

            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout gagal:",
                    error
                );

                alert(
                    "Logout gagal. Silakan coba lagi."
                );

                return;
            }


            window.location.href =
                "index.html";

        }


        document
            .getElementById("logoutButtonTop")
            .addEventListener(
                "click",
                logout
            );


        /* =========================
           START
        ========================== */

        loadStaffProfile();
