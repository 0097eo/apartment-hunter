export class AuthError extends Error {
    constructor(message: string = 'Authentication Failed') {
        super(message);
        this.name = 'AuthError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string = 'Resource Not Found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Access Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends Error {
    public details: any[];
    constructor(message: string = 'Validation Failed', details: any[] = []) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}