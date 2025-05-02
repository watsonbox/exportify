# Exportify: Your Comprehensive Spotify Playlist Backup and Export Solution

## Project Overview

Exportify is a powerful web application designed to solve a critical need for Spotify users: exporting and backing up their playlists. It provides a simple, secure, and comprehensive solution for preserving your music collection by allowing users to export Spotify playlists directly in the browser.

### Core Purpose

The application addresses the significant limitation in Spotify's native client by enabling users to:
- Export playlists to CSV format
- Create comprehensive backups of music collections
- Preserve playlist metadata and track information

### Key Features

- 🔐 **Secure Browser-Based Export**: Entirely runs in the browser with no data storage
- 🌐 **Comprehensive Track Data Export**: Includes detailed track information such as:
  - Track and artist details
  - Album metadata
  - Track duration and popularity
  - URI information for easy re-importing
- 🔍 **Advanced Playlist Search**: Quickly find and filter playlists with advanced search syntax
- 🌓 **Dark Mode Support**: Comfortable viewing in any lighting condition
- 🌍 **Multilingual**: Available in 10 languages (English, French, Spanish, Italian, German, Portuguese, Swedish, Dutch, Japanese, and Arabic)
- 📱 **Mobile-Friendly Design**: Accessible from any device
- 🚀 **Efficient Export**: Intelligent rate limiting for smooth, speedy playlist exports

### Additional Export Options

Users can enhance their exports by including:
- Extended artist data (including genres)
- Detailed audio features (danceability, energy, tempo, etc.)
- Additional album information (genres, label, copyrights)

### Benefits

- **Data Preservation**: Safeguard your music collection against potential loss
- **Flexibility**: Easy to export and re-import playlists
- **Transparency**: Complete visibility into your music library's metadata
- **User Control**: Comprehensive export options tailored to individual needs

## Getting Started, Installation, and Setup

### Prerequisites

- Node.js (version 18.18 or later)
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

### Running the Application

#### Development Mode
To run the application in development mode:
```bash
yarn start
```
The application will start on `http://localhost:3000`

#### Production Build
To create a production build:
```bash
yarn build
```
The production-ready files will be generated in the `build` directory.

### Docker Deployment

You can also run the application using Docker:

1. Build the Docker image:
   ```bash
   docker build -t exportify .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 3000:3000 exportify
   ```

### Browser Compatibility

The application supports the following browsers:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)

#### Note
Ensure you have a stable internet connection, as the application may require external resources during runtime.

## Deployment

The application is designed for easy deployment across multiple platforms with built-in support for containerization and GitHub Pages hosting.

### Docker Deployment

To deploy using Docker:

```bash
# Build the Docker image
docker build -t exportify .

# Run the Docker container
docker run -p 3000:3000 exportify
```

The Dockerfile uses Node 18.18 Alpine as the base image and exposes port 3000.

### GitHub Pages Deployment

The project includes a GitHub Actions workflow for automatic deployment to GitHub Pages when changes are pushed to the `master` branch. The workflow:
- Uses Node.js 18.x
- Installs dependencies with Yarn
- Runs tests
- Builds the application
- Deploys the `build` directory to GitHub Pages

### Manual Build and Deployment

To manually build the application:

```bash
# Install dependencies
yarn install

# Build for production
yarn build
```

The production build will be located in the `build` directory, ready for deployment to static hosting platforms like Vercel, Netlify, or any web server.

### Deployment Platforms

The application is compatible with:
- Docker containers
- GitHub Pages
- Static hosting platforms (Vercel, Netlify)
- Traditional web servers

#### Hosting Considerations
- Ensure Node.js 18.x is available in the deployment environment
- The application uses React and requires standard frontend hosting configurations
- Environment variables may need to be configured based on the specific deployment platform

## Configuration

### Build Configuration

The project uses React with TypeScript and supports the following build configurations:

#### Compiler Options
- Target ECMAScript version: ES5
- TypeScript strict mode: Enabled
- Module resolution: Node
- JSX support for React

#### Browser Support
Production builds target:
- Browsers with >0.2% global usage
- Excluding dead browsers
- Excluding Opera Mini

Development builds support:
- Latest Chrome version
- Latest Firefox version
- Latest Safari version

### Internationalization (i18n)
The application supports multiple languages with the following configuration:
- Fallback language: English
- Supported languages: 
  - Arabic (ar)
  - German (de)
  - English (en)
  - Spanish (es)
  - French (fr)
  - Italian (it)
  - Dutch (nl)
  - Portuguese (pt)
  - Swedish (sv)
  - Japanese (ja)
  - Turkish (tr)

### Build Scripts
Available npm/yarn scripts:
- `start`: Launch development server
- `build`: Create production build
- `test`: Run test suite
- `eject`: Eject from Create React App configuration

### Error Tracking
- Integrated with Bugsnag for error monitoring and tracking

### Testing
- Jest configured with custom transformation for Axios
- React Testing Library for component tests

## Project Structure

The project follows a standard React TypeScript project structure with the following key directories and files:

### Root Directory
- `Dockerfile`: Container configuration for deployment
- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `.github/workflows/ci.yml`: Continuous Integration configuration
- `.gitignore`: Git ignore rules

### Source Code (`src/`)
- `index.tsx`: Application entry point
- `App.tsx`: Main application component
- `helpers.ts`: Utility functions
- `icons.ts`: Icon definitions

#### Components (`src/components/`)
- Core UI components for the application:
  - `Login.tsx`: Authentication component
  - `TopMenu.tsx`: Navigation menu
  - `PlaylistSearch.tsx`: Playlist search functionality
  - `PlaylistTable.tsx`: Displays playlist information
  - `PlaylistExporter.tsx`: Playlist export features
  - `ConfigDropdown.tsx`: Configuration selection component

#### Data Management (`src/components/data/`)
- Data-related TypeScript files for handling different types of data:
  - `PlaylistsData.ts`
  - `TracksData.ts`
  - `TracksArtistsData.ts`
  - `TracksAlbumData.ts`
  - `TracksAudioFeaturesData.ts`

#### Internationalization (`src/i18n/`)
- Localization support with translation files for multiple languages:
  - `config.ts`: Internationalization configuration
  - `locales/`: Contains translation JSON files for languages including Arabic, German, English, Spanish, French, Italian, Japanese, Dutch, Portuguese, Swedish, and Turkish

### Public Assets (`public/`)
- `index.html`: Main HTML template
- `favicon.png`: Application favicon
- `robots.txt`: Web crawler instructions

### Testing and Configuration
- `src/setupTests.ts`: Test setup configuration
- `src/mocks/handlers.ts`: Mock API handlers for testing
- `src/App.test.tsx`: Application test suite

### Static Assets
- `assets/`: Contains additional images like `bugsnag.png` and `screenshot.png`

## Technologies Used

#### Frontend Framework
- React (v18.3.1)
- TypeScript (v5.5.4)

#### UI Libraries and Styling
- React Bootstrap (v2.10.4)
- Bootstrap (v5.3.3)
- Sass (v1.77.8)
- Font Awesome (v6.6.0)

#### State Management and Utility Libraries
- Axios (v1.8.2) - HTTP client
- JSZip (v3.10.1) - ZIP file generation
- Bottleneck - Rate limiting
- File-saver - Client-side file saving

#### Internationalization
- i18next (v23.14.0)
- i18next-browser-languagedetector

#### Testing
- Jest
- React Testing Library
- MSW (Mock Service Worker)

#### Error Tracking
- Bugsnag (JavaScript and React plugins)

#### Development Tools
- React Scripts (v5.0.1)
- ESLint
- GitHub Pages (deployment)

#### Supported Browsers
- Modern browsers with >0.2% global usage
- Specific support for latest versions of Chrome, Firefox, and Safari

## Additional Notes

### Spotify API Limitations

The application is subject to certain limitations imposed by the Spotify Web API:
- Playlist folders are not retrievable or creatable through the Web API
- Bulk data export can be request-intensive, so users are encouraged to use the tool responsibly

### Playlist Recovery

In case of accidental playlist deletion, Spotify provides a playlist recovery mechanism through their support system.

### Open Source and Independence

This project is an independent, community-driven application:
- Not officially affiliated with Spotify
- Uses the Spotify Web API like any third-party application
- Developed and maintained by open-source contributors

### Error Monitoring

The application employs Bugsnag for error tracking and monitoring, helping to improve overall reliability and user experience.

### Internationalization

The application supports multiple languages, including:
- English
- French
- Spanish
- Italian
- German
- Portuguese
- Swedish
- Dutch
- Japanese
- Arabic

### Performance Considerations

- Exporting additional data (artist, album, audio features) increases export time
- Large numbers of playlists may result in longer processing times
- Advanced rate limiting has been implemented to optimize API usage

## Contributing

We welcome contributions to Exportify! Here are some guidelines to help you get started:

### How to Contribute

1. Fork the repository on GitHub
2. Clone your forked repository to your local machine
3. Create a new branch for your feature or bug fix (`git checkout -b my-new-feature`)
4. Make your changes and commit them with a clear, descriptive commit message
5. Push your changes to your fork (`git push origin my-new-feature`)
6. Open a pull request to the main repository

### Development Setup

- Ensure you have Node.js (version 18.x recommended) and Yarn installed
- Run `yarn install` to install project dependencies
- Use `yarn start` to run the development server
- Use `yarn test` to run the test suite

### Code Guidelines

#### Code Style
- The project uses TypeScript and React
- Follow the existing code style in the project
- The project uses ESLint with React and Jest configurations
- Run `yarn test` to ensure your changes pass existing tests

#### Testing
- Write tests for new features using React Testing Library
- Ensure all tests pass before submitting a pull request
- Aim for good test coverage of new functionality

### Pull Request Process

- Ensure your code passes all CI checks
- Provide a clear description of your changes in the pull request
- Update documentation as needed
- Your pull request will be reviewed by the maintainers

### Reporting Issues

- Use GitHub Issues to report bugs or suggest features
- Provide detailed information about the issue
- Include steps to reproduce, expected behavior, and actual behavior
- If reporting a bug, include your environment details (OS, browser, etc.)

### Code of Conduct

Please be respectful and considerate of others. Harassment and discrimination are not tolerated in this project.

### Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers.

## License

This project is licensed under the MIT License. 

#### Key Permissions
- Commercial use
- Modification
- Distribution
- Private use

#### Conditions
- License and copyright notice must be included
- No warranty or liability

The full license text is available in the [LICENSE](LICENSE) file. Refer to the detailed license for complete terms and conditions.

#### Copyright
Copyright (c) 2015 Howard Wilson