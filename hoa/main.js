(() => {
  const initialize = () => {
  const style = document.createElement("style");
  style.textContent = `
    .hoa-auth-launcher{position:fixed;right:20px;bottom:20px;z-index:10000;border:0;border-radius:999px;padding:12px 20px;background:#2563eb;color:#fff;font:inherit;font-size:14px;font-weight:600;box-shadow:0 8px 24px #0f172a33;cursor:pointer}
    .hoa-auth-launcher:hover{background:#1d4ed8}
    .hoa-auth-overlay{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:20px;background:#0f172a88}
    .hoa-auth-overlay[hidden]{display:none}
    .hoa-auth-dialog{position:relative;width:min(100%,420px);padding:28px;border-radius:18px;background:#fff;color:#0f172a;box-shadow:0 24px 70px #0003;font:400 15px/1.5 system-ui,sans-serif}
    .hoa-auth-dialog h2{margin:0 0 6px;font-size:24px}
    .hoa-auth-dialog p{margin:0 0 18px;color:#64748b}
    .hoa-auth-close{position:absolute;top:12px;right:14px;border:0;background:transparent;color:#64748b;font-size:24px;cursor:pointer}
    .hoa-auth-tabs{display:flex;gap:8px;margin:18px 0}
    .hoa-auth-tabs button,.hoa-auth-submit,.hoa-auth-logout{border:0;border-radius:9px;padding:10px 14px;font:600 14px system-ui,sans-serif;cursor:pointer}
    .hoa-auth-tabs button{flex:1;background:#f1f5f9;color:#334155}
    .hoa-auth-tabs button[aria-selected="true"]{background:#dbeafe;color:#1d4ed8}
    .hoa-auth-form label{display:block;margin:12px 0 6px;font-weight:600}
    .hoa-auth-form input{box-sizing:border-box;width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:11px 12px;font:inherit}
    .hoa-auth-form input:focus{outline:2px solid #93c5fd;border-color:#2563eb}
    .hoa-auth-submit,.hoa-auth-logout{width:100%;margin-top:18px;background:#2563eb;color:#fff}
    .hoa-auth-submit:disabled,.hoa-auth-logout:disabled{opacity:.65;cursor:wait}
    .hoa-auth-message{min-height:1.5em;margin:12px 0 0!important;color:#b91c1c!important}
    .hoa-auth-message[data-kind="success"]{color:#15803d!important}
    .hoa-auth-account{margin-top:16px;padding:14px;border-radius:10px;background:#f8fafc;overflow-wrap:anywhere}
    @media(max-width:480px){.hoa-auth-launcher{right:14px;bottom:14px}.hoa-auth-dialog{padding:24px 20px}}
  `;
  document.head.append(style);

  const launcher = document.createElement("button");
  launcher.className = "hoa-auth-launcher";
  launcher.type = "button";
  launcher.textContent = "Đăng nhập";
  launcher.setAttribute("aria-haspopup", "dialog");

  const overlay = document.createElement("div");
  overlay.className = "hoa-auth-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="hoa-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="hoa-auth-title">
      <button class="hoa-auth-close" type="button" aria-label="Đóng">&times;</button>
      <h2 id="hoa-auth-title">Tài khoản</h2>
      <p id="hoa-auth-description">Đăng nhập hoặc tạo tài khoản để tiếp tục.</p>
      <div class="hoa-auth-tabs" role="tablist" aria-label="Tài khoản">
        <button type="button" role="tab" data-mode="login" aria-selected="true">Đăng nhập</button>
        <button type="button" role="tab" data-mode="register" aria-selected="false">Đăng ký</button>
      </div>
      <form class="hoa-auth-form">
        <label for="hoa-auth-email">Email</label>
        <input id="hoa-auth-email" name="email" type="email" autocomplete="email" required>
        <label for="hoa-auth-password">Mật khẩu</label>
        <input id="hoa-auth-password" name="password" type="password" autocomplete="current-password" minlength="6" required>
        <button class="hoa-auth-submit" type="submit">Đăng nhập</button>
      </form>
      <p class="hoa-auth-message" role="status" aria-live="polite"></p>
      <div class="hoa-auth-account" hidden></div>
      <button class="hoa-auth-logout" type="button" hidden>Đăng xuất</button>
    </section>
  `;
  document.body.append(launcher, overlay);

  const dialog = overlay.querySelector(".hoa-auth-dialog");
  const form = overlay.querySelector(".hoa-auth-form");
  const emailInput = overlay.querySelector("#hoa-auth-email");
  const passwordInput = overlay.querySelector("#hoa-auth-password");
  const submitButton = overlay.querySelector(".hoa-auth-submit");
  const message = overlay.querySelector(".hoa-auth-message");
  const account = overlay.querySelector(".hoa-auth-account");
  const logoutButton = overlay.querySelector(".hoa-auth-logout");
  let mode = "login";
  let currentUser = null;
  let firebaseAuth = null;

  const setMessage = (text, kind = "error") => {
    message.textContent = text;
    message.dataset.kind = kind;
  };

  const closeDialog = () => {
    overlay.hidden = true;
    launcher.focus();
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    overlay.querySelectorAll("[data-mode]").forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.setAttribute("aria-selected", String(selected));
    });
    const registering = mode === "register";
    submitButton.textContent = registering ? "Tạo tài khoản" : "Đăng nhập";
    passwordInput.autocomplete = registering ? "new-password" : "current-password";
    message.textContent = "";
  };

  const updateAccount = (user) => {
    currentUser = user;
    launcher.textContent = user ? "Tài khoản" : "Đăng nhập";
    account.hidden = !user;
    logoutButton.hidden = !user;
    form.hidden = Boolean(user);
    overlay.querySelector(".hoa-auth-tabs").hidden = Boolean(user);
    overlay.querySelector("#hoa-auth-description").textContent = user
      ? "Bạn đã đăng nhập."
      : "Đăng nhập hoặc tạo tài khoản để tiếp tục.";
    account.textContent = user ? `Đã đăng nhập: ${user.email || "Tài khoản Firebase"}` : "";
  };

  const readableAuthError = (error) => {
    const messages = {
      "auth/email-already-in-use": "Email này đã được đăng ký.",
      "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
      "auth/invalid-email": "Địa chỉ email không hợp lệ.",
      "auth/too-many-requests": "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
      "auth/weak-password": "Mật khẩu cần có ít nhất 6 ký tự.",
      "auth/network-request-failed": "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.",
      "auth/user-disabled": "Tài khoản này đã bị vô hiệu hóa.",
      "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
      "auth/wrong-password": "Email hoặc mật khẩu không chính xác.",
    };
    return messages[error.code] || error.message || "Không thể xác thực tài khoản.";
  };

  launcher.addEventListener("click", () => {
    overlay.hidden = false;
    setMessage("");
    if (currentUser) {
      overlay.querySelector(".hoa-auth-tabs").hidden = true;
      form.hidden = true;
    }
    dialog.querySelector(".hoa-auth-close").focus();
  });

  overlay.querySelector(".hoa-auth-close").addEventListener("click", closeDialog);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeDialog();
  });
  overlay.querySelectorAll("[data-mode]").forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!firebaseAuth) {
      setMessage("Dịch vụ đăng nhập chưa sẵn sàng. Vui lòng thử lại sau.");
      return;
    }

    submitButton.disabled = true;
    setMessage(mode === "register" ? "Đang tạo tài khoản..." : "Đang đăng nhập.", "success");
    try {
      if (mode === "register") {
        await firebaseAuth.createUserWithEmailAndPassword(
          emailInput.value.trim(),
          passwordInput.value,
        );
      } else {
        await firebaseAuth.signInWithEmailAndPassword(
          emailInput.value.trim(),
          passwordInput.value,
        );
      }
      setMessage(mode === "register" ? "Tạo tài khoản thành công." : "Đăng nhập thành công.", "success");
      closeDialog();
      form.reset();
    } catch (error) {
      console.error("Firebase authentication failed:", error);
      setMessage(readableAuthError(error));
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
      await firebaseAuth.signOut();
      setMessage("Đã đăng xuất.", "success");
    } catch (error) {
      console.error("Firebase sign-out failed:", error);
      setMessage(readableAuthError(error));
    } finally {
      logoutButton.disabled = false;
    }
  });

  window.firebaseAuthReady
    .then((api) => {
      firebaseAuth = api;
      api.onAuthStateChanged(updateAccount, (error) => {
        console.error("Firebase authentication state failed:", error);
        setMessage(readableAuthError(error));
      });
    })
    .catch((error) => {
      console.error("Firebase initialization failed:", error);
      setMessage("Không thể kết nối dịch vụ đăng nhập. Vui lòng thử tải lại trang.");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();