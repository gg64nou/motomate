# MotoMate

[![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](LICENSE)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/hawkinslabdev/motomate/.github%2Fworkflows%2Fbuild-container.yml)](#)
[![GitHub Tag](https://img.shields.io/github/v/tag/hawkinslabdev/motomate?label=version)](#)
[![Support](https://img.shields.io/badge/Support-Buy%20me%20a%20coffee-fdd734?logo=buy-me-a-coffee)](https://coff.ee/hawkinslabdev)

Take control of your **vehicle maintenance** with MotoMate, a self-hosted (maintenance) tracking web application. Access your digital maintenance journal from any mobile device to log tasks right from the garage. Because it is self-hosted, your data and service history never leave your own hardware.

> [!WARNING]
> **We need your help!** MotoMate is still under _active_ development and you may encounter bugs. Please help improve the project by reporting issues, suggesting missing features, or, preferably, submitting a pull request.

<img width="100%" alt="MotoMate screenshot" src=".github/images/example.webp" />

We want to make it incredibly simple for riders and vehicle enthusiasts to host their own maintenance journals. Unlike more complex systems such as [LubeLogger](https://lubelogger.com/?ref=github.com/hawkinslabdev/motomate), MotoMate is designed to strip your tracking down to the absolute essentials. 

## Getting Started

You can run MotoMate locally using Docker Compose:

```yaml
services:
  motomate:
    image: ghcr.io/hawkinslabdev/motomate:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - TZ=Europe/Amsterdam
      - PUBLIC_APP_URL=http://localhost:3000
      - PUBLIC_APP_ORIGINS=http://localhost
      - AUTH_COOKIE_SECURE=false
      - AUTH_SECRET=change-me-in-production-min-32-chars
      - AUTH_ALLOW_REGISTRATION=true
      - STORAGE_ADAPTER=local
      - BODY_SIZE_LIMIT=20971520
    restart: unless-stopped
```

After downloading the image and starting the container, the application will be ready in a few seconds once database migrations complete.

## Donate

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_me_a_coffee-fdd734?\&logo=buy-me-a-coffee\&logoColor=black\&style=for-the-badge)](https://coff.ee/hawkinslabdev)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-30363d?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/sponsors/hawkinslabdev)

Want to support MotoMate? Drop a star on GitHub, or consider supporting development via GitHub Sponsors or Buy Me a Coffee.

## License

This project is licensed under the **AGPL 3.0** license. See [LICENSE](LICENSE) for details.

## Contributing

Contributions including ideas, bug reports, and pull requests are welcome. Please open an issue to discuss any proposed changes or identified issues.
