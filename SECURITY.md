# Security Policy

## Reporting a vulnerability

Report suspected vulnerabilities privately through the repository's Security tab using "Report a vulnerability". Do not open a public issue for a security problem.

Include the affected route, browser, reproduction steps, and the impact you expect. You will receive a response within seven days.

## Scope

cptracker is a static site. It has no server, database, account system, or analytics. Handles and cached statistics stay in browser `localStorage`, and requests go directly from the browser to the public platform APIs.

Relevant reports include:

- A way to execute injected script in the page
- A Content Security Policy bypass that allows an unexpected origin
- A stored value that leaks to another origin
- A dependency with a known vulnerability that affects the build or the shipped bundle

Reports about the availability or accuracy of the Codeforces, AtCoder, or LeetCode APIs belong to those platforms.
