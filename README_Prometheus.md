# Exportify: Spotify Playlist Backup and Export Utility

## Project Overview

Exportify is a web application designed to help Spotify users export and backup their playlists with ease. Built as a browser-based solution, it provides a user-friendly interface for exporting playlist data directly from Spotify without storing any user information.

### Core Purpose

The primary goal of Exportify is to solve a critical gap in Spotify's native functionality: the ability to export, archive, and backup playlists. By leveraging the Spotify Web API, users can quickly and securely create comprehensive CSV exports of their music collections.

### Key Features

- 📦 **Complete Playlist Export**: Easily export individual or all Spotify playlists to CSV format
- 🔍 **Advanced Search**: Search and filter playlists using intuitive and advanced search syntax
- 📊 **Detailed Track Metadata**: Export extensive track information including URIs, artist details, album information, and more
- 🌐 **Multilingual Support**: Available in 10 languages (English, French, Spanish, Italian, German, Portuguese, Swedish, Dutch, Japanese, and Arabic)
- 🌓 **Dark Mode**: Comfortable viewing experience in low-light environments
- 📱 **Mobile Friendly**: Full functionality across desktop and mobile devices

### Export Capabilities

Exportify offers flexible export options, allowing users to include additional metadata such as:
- Artist genres
- Audio features (danceability, energy, tempo, etc.)
- Album details (genres, label, copyrights)

### Key Benefits

- 🔐 **Privacy-First**: No user data is saved; everything runs in the browser
- 🚀 **Performance**: Optimized API handling for smooth, efficient exports
- 📋 **Comprehensive Backup**: Create a complete, readable archive of your Spotify playlists

## Getting Started, Installation, and Setup

### Prerequisites

- Node.js (version 18.18 or later)
- Yarn package manager

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/exportify.git
   cd exportify
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

### Development 

To run the application in development mode:

```bash
yarn start
```

The application will launch on `http://localhost:3000`.

### Production Build

To create a production build:

```bash
yarn build
```

The production-ready files will be generated in the `build` directory.

### Docker Deployment

You can also run the application using Docker:

```bash
# Build the Docker image
docker build -t exportify .

# Run the Docker container
docker run -p 3000:3000 exportify
```

### Browser Compatibility

The application supports:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)

### Notes

- Ensure you have the latest version of Node.js and Yarn installed
- An active internet connection is required for initial setup and running the application

## Deployment

The documentation for the Deployment section will focus on the methods evident in the project files:

Docker Deployment:
```bash
# Build the Docker image
docker build -t exportify .

# Run the Docker container
docker run -p 3000:3000 exportify
```

GitHub Pages Deployment:
The project is configured to automatically deploy to GitHub Pages when changes are pushed to the master branch. The GitHub Actions workflow in `.github/workflows/ci.yml` handles this process:
- Runs on Node.js 18.x
- Installs dependencies using Yarn
- Runs tests
- Builds the application
- Deploys the `build` directory to GitHub Pages

### Prerequisites
- Node.js 18.x
- Yarn package manager
- Docker (optional, for containerized deployment)

### Build Commands
```bash
# Install dependencies
yarn install

# Build for production
yarn build

# Run tests before deployment
yarn test
```

### Deployment Platforms
- **GitHub Pages**: Automatic deployment on master branch
- **Docker**: Containerized deployment available
- **Hosting Compatibility**: Static hosting platforms like Netlify, Vercel, and GitHub Pages are supported

### Environment Notes
- The application uses a static build process
- Requires no additional backend configuration
- Uses React Scripts for build and deployment

## Feature Highlights

### Spotify Playlist Management and Export

Exportify provides a powerful set of features for Spotify users to manage and export their playlists:

#### Authentication
- Secure Spotify account authentication using OAuth
- One-click login with Spotify credentials
- Supports multiple user account connections
- Requests permissions for reading private and collaborative playlists

#### Playlist Export Capabilities
- Export entire playlists to CSV format
- Configurable export options with multiple data enrichment features:
  - Base track information
  - Artists data
  - Audio features
  - Album details

#### Flexible Data Export
- Comprehensive track metadata export
- Supports multiple languages
- Sanitized filename generation for exported files
- Handles special characters in playlist names

#### User Interface
- Clean, responsive design
- Intuitive playlist management interface
- Error handling for Spotify API interactions
- Mobile and desktop friendly

#### Language Support
Exportify supports multiple languages, enhancing global accessibility:
- Arabic
- German
- English
- Spanish
- French
- Italian
- Japanese
- Dutch
- Portuguese
- Swedish
- Turkish

## Additional Notes

### API and Usage Considerations

- **Spotify API Limitations**: Spotify's Web API does not currently support retrieving playlist folders. Users should be aware that nested playlist structures may not be fully preserved during export.

### Performance and Responsibility

- **API Request Management**: The application implements advanced rate limiting to optimize Spotify API interactions. However, bulk exports of large numbers of playlists may take considerable time.
- **Responsible Usage**: Users are encouraged to use the export functionality judiciously to prevent potential API access issues.

### Data Privacy and Security

- **Browser-Based Processing**: All data processing occurs entirely in the user's browser. No playlist or track information is stored or transmitted to external servers.
- **Read-Only Access**: The application only requires read-only permissions to Spotify playlists, ensuring minimal risk to user account security.

### Compatibility and Internationalization

- **Multi-Language Support**: The application is available in 10 languages, including English, French, Spanish, Italian, German, Portuguese, Swedish, Dutch, Japanese, and Arabic.
- **Cross-Platform Compatibility**: Designed to be mobile-friendly and functional across different devices and screen sizes.

### Error Handling and Monitoring

- **Error Tracking**: Utilizes Bugsnag for monitoring and reporting application errors, helping to improve overall user experience and application stability.

### Disclaimer

- This project is an independent application and is not officially affiliated with Spotify. It is a community-developed tool that leverages the Spotify Web API.

## Contributing

We welcome contributions to Exportify! Here are some guidelines to help you get started:

### Getting Started
1. Fork the repository and clone it locally
2. Install dependencies using Yarn:
   ```
   yarn install
   ```

### Development Workflow
- Use Yarn for package management
- The project uses TypeScript with React

### Code Style
- Follow the existing ESLint configuration
- The project extends `react-app` and `react-app/jest` ESLint configs
- Use consistent code formatting

### Running Tests
Run the test suite using:
```
yarn test
```
- Tests are written using React Testing Library and Jest
- Ensure all tests pass before submitting a pull request

### Building the Project
To build the project locally:
```
yarn build
```

### Pull Request Process
1. Ensure your code passes all tests
2. Update documentation as needed
3. Your pull request will be reviewed by the maintainers

### Supported Node Version
- Node.js 18.x is recommended (as used in CI workflow)

#### Notes
- This project uses Continuous Integration (CI) with GitHub Actions
- Automated tests and builds are run on every push and pull request

## License

This project is licensed under the [MIT License](LICENSE). 

#### Key License Terms
- Freely use, modify, and distribute the software
- Include the original copyright notice
- No warranty is provided
- Authors are not liable for damages

#### Copyright
Copyright (c) 2015 Howard Wilson