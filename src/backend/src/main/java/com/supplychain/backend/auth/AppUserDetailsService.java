package com.supplychain.backend.auth;

import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * NFR-WEB-004: single operations-analyst role only -- every `app_user` row gets the one
 * `ROLE_ANALYST` authority; there is no roles table to look up (no multi-role authorization in
 * MVP scope).
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public AppUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser appUser = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No such user: " + username));
        return new User(appUser.getUsername(), appUser.getCredentialReference(),
                List.of(new SimpleGrantedAuthority("ROLE_ANALYST")));
    }
}
