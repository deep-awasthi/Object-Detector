package ai.deepclone.common.exception;

/**
 * Thrown when a requested resource cannot be found.
 */
public class ResourceNotFoundException extends DeepCloneException {

    public ResourceNotFoundException(String resource, Object id) {
        super("RESOURCE_NOT_FOUND", "%s not found with id: %s".formatted(resource, id));
    }

    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", message);
    }
}
