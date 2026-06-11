async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const msg = document.getElementById("msg");
  msg.innerText = "Logging in...";

  try {
    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      msg.innerText = data.message || "Login failed";
    }

  } catch (err) {
    console.log(err);
    msg.innerText = "Server not responding";
  }
}