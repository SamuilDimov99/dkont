package com.example.logistics;

import com.example.logistics.model.Role;
import com.example.logistics.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUserControllerTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void managesUsersThroughApi() throws Exception {
        String createdJson = mvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "api-user",
                                "password", "demo",
                                "email", "api-user@example.test",
                                "role", "EMPLOYEE"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        User created = objectMapper.readValue(createdJson, User.class);
        assertThat(created.getRole()).isEqualTo(Role.EMPLOYEE);

        String changedJson = mvc.perform(patch("/api/admin/users/api-user/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "ADMIN"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        User changed = objectMapper.readValue(changedJson, User.class);
        assertThat(changed.getRole()).isEqualTo(Role.ADMIN);

        mvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/admin/users/api-user"))
                .andExpect(status().isOk());
    }
}
