const SUPABASE_URL =
            "https://ipnoshuvofomxwssamma.supabase.co";

        const SUPABASE_KEY =
            "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

        const supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        // Cek apakah user sudah login
        async function checkSession() {

            const {
                data: { session }
            } = await supabaseClient.auth.getSession();

            if (session) {

                window.location.href =
                    "./";

            }
        }


        checkSession();


        // Proses login
        document
            .getElementById("loginForm")
            .addEventListener(
                "submit",
                async function(event) {

                    event.preventDefault();

                    const email =
                        document
                            .getElementById("email")
                            .value
                            .trim();

                    const password =
                        document
                            .getElementById("password")
                            .value;

                    const button =
                        document
                            .getElementById("loginButton");

                    const message =
                        document
                            .getElementById("message");


                    button.disabled = true;
                    button.textContent = "Memproses...";
                    message.textContent = "";


                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth
                            .signInWithPassword({
                                email: email,
                                password: password
                            });


                    if (error) {

                        message.textContent =
                            "Login gagal. Periksa email dan password.";

                        message.style.color =
                            "#e05252";

                        button.disabled = false;
                        button.textContent = "Masuk";

                        return;
                    }


                    message.textContent =
                        "Login berhasil. Membuka aplikasi...";

                    message.style.color =
                        "#42a878";


                    window.location.href =
                        "./";

                }
            );
