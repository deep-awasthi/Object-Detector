package ai.deepclone.common.exception;

/**
 * Thrown when a user does not have permission to perform an action.
 */
public class AccessDeniedException extends DeepCloneException {

    public AccessDeniedException(String message) {
        super("ACCESS_DENIED", message);
    }
}
