const handleRegister = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    const response = await fetch(process.env.REACT_APP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.REACT_APP_API_TOKEN,
      },
      body: JSON.stringify({
        userid: `${username}${process.env.REACT_APP_USER_REALM}`,
        password: password,
        comment: "New user registered via app",
        enable: 1,
      }),
    });

    if (response.ok) {
      setSuccess("User registered successfully!");
      setError("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } else {
      const data = await response.json();
      setError(data.errors || "Failed to register user");
      setSuccess("");
    }
  } catch (err) {
    setError("An error occurred. Please try again later.");
    setSuccess("");
  }
};
