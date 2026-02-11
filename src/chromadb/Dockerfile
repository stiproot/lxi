FROM chromadb/chroma:0.5.16 as base
  COPY ["/trusted_certs.crt", "/usr/local/share/ca-certificates/"]
  RUN update-ca-certificates

FROM base as conf
  ENV ALLOW_RESET=True \
      IS_PERSISTENT=True \
      CHROMA_SERVER_AUTHN_CREDENTIALS_FILE=/chroma/server.htpasswd \
      CHROMA_SERVER_AUTHN_PROVIDER=chromadb.auth.basic_authn.BasicAuthenticationServerProvider \
      CHROMA_LOG_LEVEL=WARN
  EXPOSE 8000
  COPY ./server.htpasswd /chroma/server.htpasswd
  # COPY ./log_config.yml /chroma/chromadb/log_config.yml

  CMD ["--workers", "3", \
       "--host", "0.0.0.0", \
       "--port", "8000", \
       "--proxy-headers", \
       "--log-config", "chromadb/log_config.yml", \
       "--timeout-keep-alive", "30"]
