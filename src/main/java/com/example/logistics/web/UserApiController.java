package com.example.logistics.web;

import com.example.logistics.model.Role;
import com.example.logistics.model.User;
import com.example.logistics.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserApiController {

    private final UserService userService;


    // GET
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/by-role/{role}")
    public List<User> getUsersByRole(@PathVariable Role role) {
        return userService.getUsersByRole(role);
    }

    // POST
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(
                user.getUsername(),
                user.getPasswordHash(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole()
        );
    }

    // PUT
    @PutMapping("/{id}")
    public User updateUser(@PathVariable long id, @RequestBody User user) {
        return userService.updateUserDetails(id, user.getFirstName(), user.getLastName(), user.getEmail());
    }

    @PutMapping("/{id}/role")
    public User changeUserRole(@PathVariable long id, @RequestParam Role role) {
        return userService.changeUserRole(id, role);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable long id) {
        userService.deleteUser(id);
    }
}
