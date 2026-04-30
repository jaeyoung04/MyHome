$file = "c:\Users\4-410\Downloads\MyHome-master\board.html"
$text = [IO.File]::ReadAllText($file)

$newConfig = @"
const firebaseConfig = {
            apiKey: "AIzaSyBLwvGUYOAeOjxNh_62HUl-55jrkzKtQv0",
            authDomain: "portfolio-website-b2903.firebaseapp.com",
            projectId: "portfolio-website-b2903",
            storageBucket: "portfolio-website-b2903.firebasestorage.app",
            messagingSenderId: "336728440891",
            appId: "1:336728440891:web:f84557aa69b07a33e09c1e",
            measurementId: "G-YQ7TN9KFGF"
        };
"@

$text = $text -replace '(?s)const firebaseConfig = \{.*?\};', $newConfig
$text = $text -replace 'if\(firebaseConfig.apiKey !== "[^"]*"\) {', 'if(true) {'

[IO.File]::WriteAllText($file, $text)
Write-Host "Config injected!"
