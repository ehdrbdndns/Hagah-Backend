# Hagah Backend

A serverless backend for the Hagah application providing authentication services with support for Kakao, Apple, and Guest login methods.

## Features

- **Multi-provider Authentication**: Supports Kakao OAuth, Apple Sign In, and Guest authentication
- **Serverless Architecture**: Built with AWS Lambda and SAM framework
- **JWT Token Management**: Secure token generation and validation
- **MySQL Database**: User data storage with proper indexing
- **RESTful API**: Clean API endpoints for signup and login

## API Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication

## Authentication Providers

### Kakao OAuth
- Validates access tokens against Kakao API
- Retrieves user profile information (ID, email, name, profile image)

### Apple Sign In  
- Validates Apple ID tokens
- Extracts user information from JWT payload
- Basic token structure and expiration validation

### Guest Users
- Generates unique anonymous user IDs
- Optional email and name collection
- No external validation required

## Quick Start

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Node.js 22.x
- MySQL database

### Environment Variables
Configure the following environment variables:

```bash
# Database
DB_HOST=your-mysql-host
DB_USER=your-mysql-username  
DB_PASSWORD=your-mysql-password
DB_DATABASE=your-database-name

# JWT
JWT_SECRET_KEY=your-secret-key
```

### Database Setup
1. Create a MySQL database
2. Run the schema from `database/schema.sql`:

```sql
mysql -u username -p database_name < database/schema.sql
```

### Deployment

```bash
# Build the application
sam build

# Deploy with guided configuration
sam deploy --guided

# Or deploy with existing configuration
sam deploy
```

### Local Development

```bash
# Start local API Gateway
sam local start-api

# Test a function locally
sam local invoke AuthSignupFunction --event test-events/guest-signup.json
```

## Project Structure

```
├── function/
│   ├── auth-signup/     # Signup Lambda function
│   └── auth-login/      # Login Lambda function
├── layer/
│   ├── jwt/            # JWT utilities layer
│   └── mysql2/         # Database utilities layer
├── database/
│   └── schema.sql      # Database schema
├── docs/
│   └── authentication.md  # API documentation
└── template.yaml       # SAM template
```

## API Documentation

Detailed API documentation is available in [docs/authentication.md](docs/authentication.md).

## Security Notes

- Apple ID token validation uses basic JWT decoding. Implement full signature verification for production use.
- JWT tokens expire in 1 hour by default
- Database uses unique constraints to prevent duplicate users
- All API responses include proper CORS headers

## License

MIT License - see [LICENSE](LICENSE) file for details.
## Index
  - [Overview](#overview) 
  - [Getting Started](#getting-started)
  - [Contributing](#contributing)
  - [Authors](#authors)
  - [License](#license)
<!--  Other options to write Readme
  - [Deployment](#deployment)
  - [Used or Referenced Projects](Used-or-Referenced-Projects)
-->
## About RepositoryTemplate
<!--Wirte one paragraph of project description -->  
This project's purpose is to create a make Repository with a collection of default settings  

## Overview
<!-- Write Overview about this project -->
**If you use this template, you can use this function**
- Issue Template
- Pull Request Template
- Commit Template
- Readme Template
- Contribute Template
- Pull Request Build Test(With Github Actions)

## Getting Started
**click `Use this template` and use this template!**
<!--
### Depencies
 Write about need to install the software and how to install them 
-->
### Installing
<!-- A step by step series of examples that tell you how to get a development 
env running

Say what the step will be

    Give the example

And repeat

    until finished
-->
1. Click `Use this template` button 
2. Create New Repository
3. Update Readme and Others(Other features are noted in comments.)
<!--
## Deployment
 Add additional notes about how to deploy this on a live system
 -->
## Contributing
<!-- Write the way to contribute -->
I am looking for someone to help with this project. Please advise and point out.  
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code
of conduct, and the process for submitting pull requests to us.

## Authors
  - [Always0ne](https://github.com/Always0ne) - **SangIl Hwang** - <si8363@soongsil.ac.kr>

See also the list of [contributors](https://github.com/always0ne/readmeTemplate/contributors)
who participated in this project.
<!--
## Used or Referenced Projects
 - [referenced Project](project link) - **LICENSE** - little-bit introduce
-->

## License

```
MIT License

Copyright (c) 2020 always0ne

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
