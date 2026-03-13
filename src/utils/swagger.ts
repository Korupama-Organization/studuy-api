import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Studuy API',
            version: '1.0.0',
            description: 'REST API documentation for Studuy LMS platform',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                RegisterRequest: {
                    type: 'object',
                    required: ['fullName', 'email', 'phone', 'password'],
                    properties: {
                        fullName: { type: 'string', example: 'Nguyen Van A' },
                        email: { type: 'string', format: 'email', example: 'nguyenvana@example.com' },
                        phone: { type: 'string', example: '0912345678' },
                        password: { type: 'string', minLength: 6, example: 'secret123' },
                        role: {
                            type: 'string',
                            enum: ['student', 'teacher', 'admin'],
                            default: 'student',
                        },
                        avatar: { type: 'string', format: 'uri', example: 'https://i.pravatar.cc/150' },
                        authProvider: { type: 'string', default: 'local', example: 'local' },
                        teacherProfile: {
                            type: 'object',
                            description: 'Only applicable when role is "teacher"',
                            properties: {
                                bio: { type: 'string', example: 'Giáo viên Toán 10 năm kinh nghiệm' },
                                expertise: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['Math', 'Physics'],
                                },
                                bankAccount: {
                                    type: 'object',
                                    properties: {
                                        bankName: { type: 'string', example: 'Vietcombank' },
                                        number: { type: 'string', example: '1234567890' },
                                    },
                                },
                            },
                        },
                    },
                },
                VerifyOtpRequest: {
                    type: 'object',
                    required: ['email', 'otp'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'nguyenvana@example.com' },
                        otp: { type: 'string', example: '123456' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'nguyenvana@example.com' },
                        password: { type: 'string', example: 'secret123' },
                    },
                },
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['refresh_token'],
                    properties: {
                        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    },
                },
                ForgotPasswordRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'nguyenvana@example.com' },
                    },
                },
                ResetPasswordRequest: {
                    type: 'object',
                    required: ['reset_token', 'new_password'],
                    properties: {
                        reset_token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        new_password: { type: 'string', minLength: 6, example: 'newSecret123' },
                    },
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
                        fullName: { type: 'string', example: 'Nguyen Van A' },
                        email: { type: 'string', example: 'nguyenvana@example.com' },
                        phone: { type: 'string', example: '0912345678' },
                        role: { type: 'string', example: 'student' },
                        avatar: { type: 'string', example: 'https://i.pravatar.cc/150' },
                        authProvider: { type: 'string', example: 'local' },
                        isBlocked: { type: 'boolean', example: false },
                        emailVerified: { type: 'boolean', example: false },
                        passwordUpdatedAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' },
                    },
                },
            },
        },
    },
    // Auto-scan JSDoc comments from routes and controllers
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
