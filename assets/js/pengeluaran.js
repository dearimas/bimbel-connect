const SUPABASE_URL = "https://ipnoshuvofomxwssamma.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q95e9ofqnDyPhavmx8GLSA_Dr3rnuj5";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const messageBox = document.getElementById("message");
const tanggalInput = document.getElementById("tanggal");
const kodeInput = document.getElementById("kode");
const totalPengeluaranInput = document.getElementById("total_pengeluaran");
const detailRowsContainer = document.getElementById("detailRows");
const addDetailButton = document.getElementById("addDetailBtn");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const staffNameElement = document.getElementById("staffName");

function formatRupiah(value) {
    const nominal = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(nominal);
}

function parseCurrencyInput(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    const raw = String(value).trim();

    if (!raw) {
        return 0;
    }

    const digitsOnly = raw.replace(/[^\d]/g, "");

    if (!digitsOnly) {
        return 0;
    }

    const number = Number(digitsOnly);
    return Number.isFinite(number) ? number : 0;
}

function formatCurrencyInput(value) {
    const parsed = parseCurrencyInput(value);

    if (!Number.isFinite(parsed)) {
        return "";
    }

    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(parsed);
}

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

function formatDateDisplay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
}

function getTodayString() {
    const today = new Date();
    return formatDateDisplay(today);
}

function parseInputDateToISO(value) {
    if (!value || !/\d{2}\/\d{2}\/\d{4}/.test(value)) {
        return "";
    }

    const [day, month, year] = value.split("/");
    const isoDate = `${year}-${month}-${day}`;
    const checkDate = new Date(`${isoDate}T00:00:00`);

    return Number.isNaN(checkDate.getTime()) ? "" : isoDate;
}

function setTodayDate() {
    tanggalInput.value = getTodayString();
}

function updateTotalPengeluaran() {
    const items = detailRowsContainer.querySelectorAll(".detail-item");
    let total = 0;

    items.forEach((item) => {
        const nominalInput = item.querySelector(".detail-nominal");
        total += parseCurrencyInput(nominalInput.value);
    });

    totalPengeluaranInput.value = formatRupiah(total);
}

function createDetailRow() {
    const row = document.createElement("div");
    row.className = "detail-item";
    row.innerHTML = `
        <div class="detail-grid-row">
            <div class="field detail-field">
                <label>Keterangan</label>
                <input type="text" class="detail-keterangan" placeholder="Contoh: ATK, Listrik, dll" maxlength="255">
            </div>

            <div class="field detail-field">
                <label>Nominal</label>
                <input type="text" class="detail-nominal" inputmode="numeric" placeholder="Rp 0">
            </div>

            <button type="button" class="remove-detail-btn">Hapus</button>
        </div>
    `;

    const nominalInput = row.querySelector(".detail-nominal");
    const removeButton = row.querySelector(".remove-detail-btn");

    nominalInput.addEventListener("input", function () {
        const rawValue = this.value;

        if (!rawValue || rawValue.trim() === "") {
            this.value = "";
            updateTotalPengeluaran();
            return;
        }

        const numericValue = parseCurrencyInput(rawValue);
        this.value = formatCurrencyInput(numericValue);
        updateTotalPengeluaran();
    });

    nominalInput.addEventListener("blur", function () {
        const rawValue = this.value;
        this.value = rawValue ? formatCurrencyInput(rawValue) : "";
        updateTotalPengeluaran();
    });

    removeButton.addEventListener("click", () => {
        const totalItems = detailRowsContainer.querySelectorAll(".detail-item").length;

        if (totalItems <= 1) {
            showMessage("Minimal satu detail pengeluaran harus ada.", "error");
            return;
        }

        row.remove();
        updateTotalPengeluaran();
        clearMessage();
    });

    return row;
}

function addDetailRow() {
    const row = createDetailRow();
    detailRowsContainer.appendChild(row);
}

function validateForm() {
    const tanggalValue = tanggalInput.value.trim();
    const isoDate = parseInputDateToISO(tanggalValue);

    if (!isoDate) {
        showMessage("Format tanggal tidak valid. Gunakan DD/MM/YYYY.", "error");
        return false;
    }

    const rows = Array.from(detailRowsContainer.querySelectorAll(".detail-item"));

    if (!rows.length) {
        showMessage("Minimal satu detail pengeluaran harus ditambahkan.", "error");
        return false;
    }

    let hasValidData = false;

    for (const row of rows) {
        const keterangan = row.querySelector(".detail-keterangan").value.trim();
        const nominal = parseCurrencyInput(row.querySelector(".detail-nominal").value);

        if (!keterangan) {
            showMessage("Semua detail pengeluaran harus memiliki keterangan.", "error");
            return false;
        }

        if (nominal <= 0) {
            showMessage("Semua detail pengeluaran harus memiliki nominal lebih dari 0.", "error");
            return false;
        }

        hasValidData = true;
    }

    if (!hasValidData) {
        showMessage("Belum ada detail pengeluaran yang valid.", "error");
        return false;
    }

    return true;
}

function collectDetailPayload() {
    return Array.from(detailRowsContainer.querySelectorAll(".detail-item")).map((row) => ({
        keterangan: row.querySelector(".detail-keterangan").value.trim(),
        nominal: parseCurrencyInput(row.querySelector(".detail-nominal").value),
    }));
}

async function ensureAuthenticated() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Gagal memeriksa sesi:", error);
        throw error;
    }

    if (!session) {
        window.location.href = "index.html";
        return null;
    }

    return session;
}

async function loadStaffProfile() {
    const session = await ensureAuthenticated();

    if (!session) {
        return;
    }

    const email = session.user.email;

    const { data, error } = await supabaseClient
        .from("staff")
        .select("kode, nama, email")
        .eq("email", email)
        .maybeSingle();

    if (error) {
        console.error("Gagal memuat profil staff:", error);
        staffNameElement.textContent = "Staff";
        return;
    }

    if (!data) {
        staffNameElement.textContent = "Staff tidak ditemukan";
        return;
    }

    staffNameElement.textContent = data.nama || "Staff";
}

function resetForm() {
    kodeInput.value = "";
    setTodayDate();
    detailRowsContainer.innerHTML = "";
    addDetailRow();
    totalPengeluaranInput.value = "Rp 0";
    clearMessage();
}

async function savePengeluaran() {
    if (!validateForm()) {
        return;
    }

    const session = await ensureAuthenticated();

    if (!session) {
        return;
    }

    const isoDate = parseInputDateToISO(tanggalInput.value);
    const detailPayload = collectDetailPayload();
    const totalPengeluaran = detailPayload.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

    saveButton.disabled = true;
    saveButton.textContent = "Menyimpan...";

    try {
        const { data, error } = await supabaseClient.rpc("simpan_pengeluaran", {
            p_tanggal: isoDate,
            p_detail: detailPayload,
        });

        if (error) {
            throw error;
        }

        const savedCode = Array.isArray(data)
            ? data[0]?.kode || data[0]?.kode_pengeluaran || ""
            : data?.kode || data?.kode_pengeluaran || "";

        kodeInput.value = savedCode;
        totalPengeluaranInput.value = formatRupiah(totalPengeluaran);

        showMessage(
            `Pengeluaran berhasil disimpan. Kode: ${savedCode || "tidak tersedia"} · Total: ${formatRupiah(totalPengeluaran)}`,
            "success"
        );

        setTimeout(() => {
            resetForm();
            if (savedCode) {
                kodeInput.value = savedCode;
                totalPengeluaranInput.value = formatRupiah(totalPengeluaran);
            }
            saveButton.disabled = false;
            saveButton.textContent = "Simpan Pengeluaran";
        }, 1200);

    } catch (error) {
        console.error("Gagal menyimpan pengeluaran:", error);
        showMessage(error?.message || "Gagal menyimpan pengeluaran.", "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Simpan Pengeluaran";
    }
}

tanggalInput.addEventListener("input", function () {
    const rawValue = this.value;
    const digits = rawValue.replace(/[^\d]/g, "");

    if (!digits) {
        this.value = "";
        return;
    }

    const numbers = digits.match(/\d{1,8}/)?.[0] || "";

    if (numbers.length <= 2) {
        this.value = numbers;
        return;
    }

    if (numbers.length <= 4) {
        const day = numbers.slice(0, 2);
        const month = numbers.slice(2, 4);
        this.value = `${day}/${month}`;
        return;
    }

    const day = numbers.slice(0, 2);
    const month = numbers.slice(2, 4);
    const year = numbers.slice(4, 8);
    this.value = `${day}/${month}/${year}`;
});

tanggalInput.addEventListener("blur", function () {
    const rawValue = this.value.trim();

    if (!rawValue) {
        setTodayDate();
        return;
    }

    const match = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!match) {
        setTodayDate();
        return;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        setTodayDate();
    }
});

addDetailButton.addEventListener("click", addDetailRow);
saveButton.addEventListener("click", savePengeluaran);
cancelButton.addEventListener("click", resetForm);

(async function init() {
    try {
        await loadStaffProfile();
        resetForm();
    } catch (error) {
        console.error("Gagal menginisialisasi halaman pengeluaran:", error);
        showMessage("Gagal memuat halaman pengeluaran.", "error");
    }
})();
