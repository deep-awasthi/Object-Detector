package ai.deepclone.common.exception;

/**
 * Base runtime exception for all DeepCloneAI domain exceptions.
 */
public abstract class DeepCloneException extends RuntimeException {
    private final String errorCode;

    protected DeepCloneException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    protected DeepCloneException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
