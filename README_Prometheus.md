# Exportify: Your Spotify Playlist Backup and Management Solution

## Project Overview

Exportify is a powerful web application designed to solve a critical need for Spotify users: exporting and archiving their playlists. It provides a simple, user-friendly interface that allows users to export their Spotify playlists to CSV format, ensuring music collections can be safely backed up and preserved.

### Core Purpose

The application addresses a significant gap in Spotify's native functionality by enabling users to:
- Export entire playlists or multiple playlists at once
- Create local backups of music collections
- Preserve playlist metadata and track information

### Key Features

- 🔒 Secure, browser-based export with no data storage
- 🌐 Support for exporting individual or all playlists
- 📊 Comprehensive track data export, including:
  - Track details (name, URI, duration)
  - Artist information
  - Album metadata
- 🔍 Advanced playlist search functionality
- 🌓 Dark mode for comfortable viewing
- 🌍 Multilingual support (10 languages)
- 📱 Fully responsive, mobile-friendly design

### Benefits

- 💾 Easy playlist archiving and backup
- 🔀 Flexibility in playlist management
- 🌟 No risk of permanent playlist loss
- 🚀 Fast, efficient export process with rate limiting

## Getting Started, Installation, and Setup

### Prerequisites

- Node.js (version 16 or later recommended)
- Yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/exportify.git
   cd exportify
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

### Development Setup

To run the application in development mode:

```bash
yarn start
```

The application will launch in development mode and open in your default browser at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
yarn build
```

The optimized production-ready files will be generated in the `build` directory.

### Running Tests

To run the test suite:

```bash
yarn test
```

### Additional Configuration

#### Environment Variables

No specific environment variables are required for initial setup. The application uses default configuration.

#### Browser Compatibility

The application supports the following browsers:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)

**Note:** For the best experience, keep your browser updated to the latest version.

## Deployment

### Build Process

To build the application for production, use the following command:

```bash
yarn build
```

This will create an optimized production build in the `build` directory.

### Deployment Options

#### Docker
The project includes a Dockerfile for containerized deployment:

```bash
docker build -t exportify .
docker run -p 3000:3000 exportify
```

#### GitHub Pages
The project is configured for automatic deployment to GitHub Pages when changes are pushed to the `master` branch. This is managed through GitHub Actions in `.github/workflows/ci.yml`.

#### Manual Deployment
For manual deployments to platforms like Vercel or Netlify:

1. Build the production assets:
   ```bash
   yarn build
   ```

2. Deploy the contents of the `build` directory to your preferred hosting platform.

#### Supported Platforms
- GitHub Pages
- Docker
- Static hosting platforms (Vercel, Netlify, etc.)

### Environment Considerations
- Node.js version: 18.x recommended
- Uses Yarn for package management
- Exposes application on port 3000 by default

### Important Notes
- Ensure all environment variables are properly configured before deployment
- The application requires client-side dependencies to be installed via `yarn install`

## Feature Highlights

Exportify provides powerful features for managing and exporting Spotify playlists:

### Spotify Authentication
- Seamless login with Spotify account using OAuth
- Secure authentication with specific scopes:
  - Read private playlists
  - Read collaborative playlists
  - Access user library

### Playlist Management
- View and browse all Spotify playlists
- Search and filter playlists
- Comprehensive playlist information display

### Advanced Playlist Export
- Export playlists to CSV format
- Customizable export options:
  - Include base track data
  - Optional artist information
  - Optional audio features data
  - Optional album details

### Export Customization
- Generate clean, sanitized filenames for exported playlists
- Supports multi-language interface
- Handles various track and playlist metadata

### Error Handling
- Graceful error management for Spotify API interactions
- User-friendly error messages
- Ability to retry operations

## Configuration

The project offers several configuration options and settings across different aspects of the application:

### Build and Development Configuration
- Uses React Scripts for build and development processes
- Configurable scripts in `package.json`:
  - `start`: Launches development server
  - `build`: Creates production build
  - `test`: Runs test suite
  - `eject`: Ejects from Create React App configuration

### TypeScript Configuration
Configured via `tsconfig.json` with key settings:
- Targets ES5 compatibility
- Enables strict type checking
- Supports React JSX
- Uses Node module resolution
- Includes source files from `src` directory

### Browser Compatibility
Defines browser support in `package.json`:
- Production: Supports browsers with >0.2% market share
- Development: Targets latest versions of Chrome, Firefox, and Safari

### Internationalization (i18n)
- Supports multiple languages: English, German, Spanish, French, Italian, Dutch, Portuguese, Swedish, Arabic, Japanese, Turkish
- Configurable language detection and fallback
- Default fallback language is English
- Translations managed via JSON files in `src/i18n/locales/`

### Error Tracking
- Integrated Bugsnag for error monitoring and reporting
- Configurable via Bugsnag plugins for React

### Dependency Notes
- Uses React 18
- TypeScript 5.x
- Bootstrap 5.x for styling
- Jest for testing
- ESLint with custom configuration for code quality

### Environment Considerations
- Supports both development and production environments
- Flexible configuration through environment variables and build scripts

## Project Structure

The project follows a standard React TypeScript application structure with the following key directories and files:

#### Root Directory
- `Dockerfile`: Contains containerization instructions for the application
- `package.json`: Defines project dependencies and scripts
- `tsconfig.json`: TypeScript configuration file
- `yarn.lock`: Lockfile for Yarn package manager

#### Source Directory (`src/`)
The main application code is organized in the `src/` directory:

- `App.tsx`: Primary application component
- `index.tsx`: Entry point of the application
- `helpers.ts`: Utility functions and helper methods
- `icons.ts`: Custom icon definitions

##### Components (`src/components/`)
Modular React components that compose the application interface:
- `Login.tsx`: Authentication component
- `TopMenu.tsx`: Navigation menu
- `PlaylistSearch.tsx`: Playlist search functionality
- `PlaylistExporter.tsx`: Playlist export feature
- `PlaylistTable.tsx`: Displays playlists in a tabular format
- `ConfigDropdown.tsx`: Configuration selection component

##### Data Management (`src/components/data/`)
Specialized data handling modules:
- `PlaylistsData.ts`: Playlist-related data operations
- `TracksData.ts`: Track data management
- Various track-specific data modules (e.g., `TracksAlbumData.ts`, `TracksArtistsData.ts`)

##### Internationalization (`src/i18n/`)
Multilingual support:
- `config.ts`: Internationalization configuration
- `locales/`: Translation files for multiple languages (Arabic, German, English, Spanish, etc.)

#### Public Directory (`public/`)
Static assets and HTML template:
- `index.html`: Main HTML entry point
- `favicon.png`: Application favicon
- `robots.txt`: Search engine crawling instructions

#### Assets Directory (`assets/`)
Additional project images:
- `bugsnag.png`: Likely related to error tracking
- `screenshot.png`: Application screenshot or preview

#### Testing and Configuration
- `src/App.test.tsx`: Application test suite
- `src/setupTests.ts`: Test environment configuration
- `src/mocks/handlers.ts`: Mock data/API handlers for testing
- `.github/workflows/ci.yml`: Continuous Integration configuration

## Technologies Used

#### Frontend Framework
- React (v18.3.1)
- TypeScript (v5.5.4)

#### Styling
- Bootstrap (v5.3.3)
- Sass
- Font Awesome (v6.6.0)

#### State Management and Utilities
- React DOM
- Axios (HTTP client)
- Bottleneck (Rate limiting)
- File-saver
- JSZip (File compression)

#### Internationalization
- i18next
- i18next-browser-languagedetector

#### Testing
- Jest
- React Testing Library
- Mock Service Worker (MSW)

#### Error Tracking
- Bugsnag

#### Development Tools
- React Scripts
- ESLint
- GitHub Pages

#### Runtime Environment
- Node.js (v18.18 Alpine)

#### Browser Support
- Modern browsers (>0.2%, not dead)
- Specific support for latest versions of Chrome, Firefox, and Safari

## Additional Notes

### Spotify API Limitations

The application operates within the constraints of the Spotify Web API, which has some inherent limitations:
- Playlist folders are not returned or creatable through the Web API
- Some bulk export operations may be time-consuming due to API request limitations

### Responsible Usage

The tool is designed to be a responsible solution for playlist exports. Users are encouraged to:
- Use the export feature judiciously
- Be patient during bulk export operations
- Understand the request-intensive nature of comprehensive playlist exports

### Data Privacy

- The entire application runs directly in the browser
- No user data is stored or saved externally
- Only read-only access is requested from Spotify

### Potential Use Cases

- Music library backup
- Playlist archiving
- Music data analysis
- Migration between music platforms

### Compatibility Notes

- Best experienced on modern web browsers
- Recommended for users with extensive Spotify playlists
- Supports multiple languages and dark mode for enhanced accessibility

### Disclaimer

This is an independent, community-developed tool. It is not officially affiliated with Spotify and is simply a third-party application utilizing the Spotify Web API.

## Contributing

We welcome contributions to the project! To ensure a smooth collaboration, please follow these guidelines:

### Development Setup

1. Ensure you have the following prerequisites:
   - Node.js (version 18.x recommended)
   - Yarn package manager

2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/your-username/exportify.git
   cd exportify
   yarn install
   ```

### Contribution Process

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Ensure all tests pass by running:
   ```bash
   yarn test
   ```
5. Build the project to verify no compilation errors:
   ```bash
   yarn build
   ```
6. Submit a pull request with a clear description of your changes

### Code Guidelines

- Follow the existing code style
- Write and update tests for any new functionality
- Ensure all tests pass before submitting a pull request
- Use meaningful commit messages
- Keep pull requests focused and concise

### Testing

- The project uses Jest for testing
- Run tests using: `yarn test`
- Aim to maintain or improve test coverage
- Write tests for new features and bug fixes

### Reporting Issues

- Use GitHub Issues to report bugs or suggest improvements
- Provide detailed information, including:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment details (OS, browser, etc.)

### Code of Conduct

- Be respectful and inclusive
- Collaborate constructively
- Help maintain a positive and welcoming community

### Note

By contributing, you agree that your contributions will be licensed under the project's existing license.

## License

This project is licensed under the MIT License. 

### License Details

The MIT License is a permissive free software license that allows users to do almost anything with the project's code with limited restrictions. 

Key permissions:
- Commercial use
- Modification
- Distribution
- Private use

#### Conditions
- Include the original license and copyright notice in any substantial portion of the software

#### Limitations
- No liability
- No warranty

For the full license text, see the [LICENSE](LICENSE) file in the repository.

Copyright (c) 2015 Howard Wilson