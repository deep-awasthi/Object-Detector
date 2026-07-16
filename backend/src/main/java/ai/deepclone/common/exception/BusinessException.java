package ai.deepclone.common.exception;

/**
 * Thrown when a business rule or validation constraint is violated.
 */
public class BusinessException extends DeepCloneException {

    public BusinessException(String errorCode, String message) {
        super(errorCode, message);
    }

    public BusinessException(String message) {
        super("BUSINESS_ERROR", message);
    }
}
