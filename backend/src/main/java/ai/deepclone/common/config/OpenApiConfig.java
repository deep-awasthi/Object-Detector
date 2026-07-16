package ai.deepclone.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 *
 * <p>Accessible at /api/swagger-ui.html in development.</p>
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI deepCloneOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("DeepCloneAI API")
                        .description("""
                                DeepCloneAI — A fully local AI clone platform.
                                
                                All endpoints require JWT authentication unless otherwise noted.
                                Obtain a token via POST /api/v1/auth/login.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DeepCloneAI")
                                .url("https://github.com/deepawasthi/DeepCloneAI"))
                        .license(new License().name("MIT")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT access token")));
    }
}
