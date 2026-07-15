import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.BufferedReader;
import java.io.Console;
import java.io.InputStreamReader;
import java.util.Arrays;

/**
 * Prints a BCrypt hash for bootstrap_admin.sql. Uses the same encoder as SecurityConfig, so the
 * hash it prints is what the login endpoint will verify against.
 *
 * Run from the `backend` directory:
 *   mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt
 *   java -cp "$(cat target/cp.txt)" tools/GenerateAdminHash.java
 *
 * PowerShell hides the password as you type. Git Bash / mintty gives Java no console, so the
 * password is read from stdin and stays visible — prefer PowerShell here.
 */
public class GenerateAdminHash {

    public static void main(String[] args) throws Exception {
        char[] password = readPassword();

        try {
            if (password.length < 6) {
                System.err.println("Password must be at least 6 characters (BR-03).");
                System.exit(1);
            }

            String hash = new BCryptPasswordEncoder().encode(new String(password));
            System.out.println();
            System.out.println("Paste this into bootstrap_admin.sql as @passwordHash:");
            System.out.println();
            System.out.println(hash);
            System.out.println();
        } finally {
            Arrays.fill(password, '\0');
        }
    }

    private static char[] readPassword() throws Exception {
        Console console = System.console();
        if (console != null) {
            char[] first = console.readPassword("Password for the admin account: ");
            char[] second = console.readPassword("Confirm password: ");
            if (!Arrays.equals(first, second)) {
                System.err.println("Passwords do not match.");
                System.exit(1);
            }
            Arrays.fill(second, '\0');
            return first;
        }

        System.out.println("No console (Git Bash?) - the password will be echoed as you type.");
        System.out.print("Password for the admin account: ");
        System.out.flush();
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null || line.isBlank()) {
            System.err.println("No password entered.");
            System.exit(1);
        }
        return line.trim().toCharArray();
    }
}
