package ai.deepclone.common.exception;

/**
 * Thrown when AI/Ollama service encounters an error.
 */
public class AiServiceException extends DeepCloneException {

    public AiServiceException(String message) {
        super("AI_SERVICE_ERROR", message);
    }

    public AiServiceException(String message, Throwable cause) {
        super("AI_SERVICE_ERROR", message, cause);
    }
}
