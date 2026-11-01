# Coding Arena sandbox: g++ (C++17) and Python 3.12 on the AWS Lambda Python base image.
# The base image ships the Lambda Runtime Interface Emulator, so the same image runs
# locally with `docker run -p 9000:8080 --user 1000:1000 <image>` for the security tests.
FROM public.ecr.aws/lambda/python:3.12

RUN dnf install -y gcc-c++ && dnf clean all && rm -rf /var/cache/dnf /var/cache/yum

# Precompile <bits/stdc++.h> with the exact flags the judge uses, so typical solutions
# compile in well under a second instead of two to four.
RUN set -eux; \
    hdr="$(echo '#include <bits/stdc++.h>' | g++ -std=c++17 -H -fsyntax-only -x c++ - 2>&1 | grep -m1 'bits/stdc++.h' | awk '{print $2}')"; \
    g++ -std=c++17 -O2 -pipe -x c++-header "$hdr" -o "$hdr.gch"; \
    ls -la "$hdr.gch"

COPY runbox.c handler.py ${LAMBDA_TASK_ROOT}/
RUN gcc -O2 -Wall -Wextra -o ${LAMBDA_TASK_ROOT}/runbox ${LAMBDA_TASK_ROOT}/runbox.c \
    && rm ${LAMBDA_TASK_ROOT}/runbox.c \
    && chmod 0755 ${LAMBDA_TASK_ROOT}/runbox ${LAMBDA_TASK_ROOT}/handler.py

CMD ["handler.handler"]
